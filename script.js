document.addEventListener('DOMContentLoaded', () => {
    const gridCultura = document.getElementById('grid-cultura');
    const inputBusca = document.getElementById('busca-local');
    const botoesFiltro = document.querySelectorAll('.btn-filtro');
    const modal = document.getElementById('modal-local');
    const btnFecharModal = document.getElementById('fechar-modal');
    const modalCorpo = document.getElementById('modal-corpo');
    
    let baseDeDados =;

    // Função de ingestão do JSON local (Fetch)
    async function carregarDados() {
        try {
            const resposta = await fetch('dados.json');
            if (!resposta.ok) throw new Error('Falha ao carregar o banco de dados curatorial.');
            baseDeDados = await resposta.json();
            renderizarGrid(baseDeDados);
        } catch (erro) {
            gridCultura.innerHTML = `<p style="color: var(--cor-primaria); text-align: center;">Erro ao carregar o catálogo de locais. Verifique sua conexão e tente novamente.</p>`;
            console.error(erro);
        }
    }

    // Renderização dos cartões respeitando hierarquia H3 (WCAG)
    function renderizarGrid(dados) {
        gridCultura.innerHTML = '';
        
        if(dados.length === 0) {
            gridCultura.innerHTML = `<p>Nenhum local encontrado com esses termos. Tente outra busca!</p>`;
            return;
        }

        dados.forEach(item => {
            const article = document.createElement('article');
            article.className = 'card-local';
            article.innerHTML = `
                <div>
                    <span class="badge-categoria">${item.emoji} ${item.categoria}</span>
                    <h3>${item.nome}</h3>
                    <p>${item.descricao.substring(0, 80)}...</p>
                    <div class="dor-resolvida">
                        <strong>Dica 0800:</strong> ${item.dor_resolvida}
                    </div>
                </div>
                <div class="botoes-acao">
                    <button class="btn-primario" onclick="abrirModal(${item.id})" aria-haspopup="dialog">Ver Detalhes</button>
                    <button class="btn-secundario" onclick="compartilharLocal('${item.nome}', '${item.url}')">Indicar</button>
                </div>
            `;
            gridCultura.appendChild(article);
        });
    }

    // Lógica de Filtros por Categoria e atualização ARIA
    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', (e) => {
            // Atualiza botões
            botoesFiltro.forEach(b => b.setAttribute('aria-pressed', 'false'));
            e.target.setAttribute('aria-pressed', 'true');
            
            const categoria = e.target.getAttribute('data-categoria');
            
            if (categoria === 'todos') {
                renderizarGrid(baseDeDados);
            } else {
                const filtrados = baseDeDados.filter(item => 
                    item.categoria.toLowerCase() === categoria.toLowerCase()
                );
                renderizarGrid(filtrados);
            }
        });
    });

    // Motor de Busca Simples
    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const resultados = baseDeDados.filter(item => 
            item.nome.toLowerCase().includes(termo) || 
            item.descricao.toLowerCase().includes(termo)
        );
        renderizarGrid(resultados);
    });

    // Funções do Modal Acessível
    window.abrirModal = (id) => {
        const item = baseDeDados.find(l => l.id === id);
        if (!item) return;

        modalCorpo.innerHTML = `
            <h2 id="modal-titulo" style="color: var(--cor-primaria); margin-bottom: 10px;">${item.nome}</h2>
            <p><strong>Por que ir?</strong> ${item.descricao}</p>
            <div class="dor-resolvida" style="margin: 20px 0;">
                <strong>O que você precisa saber antes de ir:</strong><br>
                ${item.dor_resolvida}
            </div>
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-primario" style="display: block; text-decoration: none;">Site Oficial / Como Chegar</a>
        `;
        
        modal.setAttribute('aria-hidden', 'false');
        btnFecharModal.focus(); // Prende o foco no modal para leitores de tela
    };

    const fecharModal = () => {
        modal.setAttribute('aria-hidden', 'true');
    };

    btnFecharModal.addEventListener('click', fecharModal);
    
    // Fechar modal ao clicar fora ou apertar ESC
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            fecharModal();
        }
    });

    // API de Compartilhamento Nativo (Viralização)
    window.compartilharLocal = async (nome, url) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `0800 eu vou: ${nome}`,
                    text: `Dá uma olhada nesse rolê de graça em BH: ${nome}`,
                    url: url
                });
            } catch (err) {
                console.log('Compartilhamento cancelado', err);
            }
        } else {
            alert('Copie este link para compartilhar: ' + url);
        }
    };

    // Inicializa a aplicação
    carregarDados();
});