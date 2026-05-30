document.addEventListener('DOMContentLoaded', () => {
    // Referências do DOM
    const gridFerramentas = document.getElementById('lista-ferramentas');
    const bentoMenu = document.getElementById('bento-menu');
    const campoBusca = document.getElementById('campo-busca');
    const btnLimpar = document.getElementById('btn-limpar-busca');
    const statusResultados = document.getElementById('status-resultados');
    const totalFerramentasStr = document.getElementById('total-ferramentas');
    const totalCategoriasStr = document.getElementById('total-categorias');
    
    // Controles Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCorpo = document.getElementById('modal-corpo');
    const btnFecharModal = document.getElementById('fechar-modal');
    
    // Google Search Engine
    const btnGoogleBusca = document.getElementById('btn-google-busca');
    const googlePanel = document.getElementById('google-search-panel');
    const btnFecharGoogle = document.getElementById('btn-fechar-google');
    const googleResultados = document.getElementById('google-resultados');
    const googleStatus = document.getElementById('google-search-status');

    // Controles Acessibilidade
    const btnTema = document.getElementById('btn-tema');
    const btnFonteMais = document.getElementById('btn-fonte-mais');
    const btnFonteMenos = document.getElementById('btn-fonte-menos');
    let tamanhoFonte = 16; 

    let dadosOriginais =;
    let categoriasSet = new Set();

    /* =========================================================
       1. CONTROLE DE ACESSIBILIDADE E TEMA VISUAL
       ========================================================= */
    btnTema.addEventListener('click', () => {
        const html = document.documentElement;
        const temaAtual = html.getAttribute('data-theme');
        html.setAttribute('data-theme', temaAtual === 'light'? 'dark' : 'light');
    });

    btnFonteMais.addEventListener('click', () => {
        if(tamanhoFonte < 24) {
            tamanhoFonte += 2;
            document.documentElement.style.fontSize = `${tamanhoFonte}px`;
        }
    });

    btnFonteMenos.addEventListener('click', () => {
        if(tamanhoFonte > 12) {
            tamanhoFonte -= 2;
            document.documentElement.style.fontSize = `${tamanhoFonte}px`;
        }
    });

    /* =========================================================
       2. CARREGAMENTO E INGESTÃO DE DADOS (FETCH)
       ========================================================= */
    async function carregarDados() {
        try {
            const resposta = await fetch('dados.json');
            if (!resposta.ok) throw new Error('Falha de rede');
            dadosOriginais = await resposta.json();
            
            if (totalFerramentasStr) totalFerramentasStr.textContent = dadosOriginais.length;
            
            extrairCategorias();
            renderizarFiltros();
            renderizarGrid(dadosOriginais);
            verificarUrlModal(); // Dispara se o usuário vier de um link compartilhado (History API)
        } catch (erro) {
            statusResultados.textContent = 'Erro ao processar o arquivo de curadoria local.';
            console.error(erro);
        }
    }

    /* =========================================================
       3. GERAÇÃO DINÂMICA DO BENTO MENU
       ========================================================= */
    function extrairCategorias() {
        dadosOriginais.forEach(item => categoriasSet.add(item.categoria));
        if (totalCategoriasStr) totalCategoriasStr.textContent = categoriasSet.size;
    }

    function renderizarFiltros() {
        bentoMenu.innerHTML = `<button type="button" class="btn-filtro ativo" data-cat="todas">Todas as Opções</button>`;
        categoriasSet.forEach(cat => {
            bentoMenu.innerHTML += `<button type="button" class="btn-filtro" data-cat="${cat}">${cat}</button>`;
        });

        document.querySelectorAll('.btn-filtro').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
                e.target.classList.add('ativo');
                
                const catEscolhida = e.target.getAttribute('data-cat');
                if(catEscolhida === 'todas') {
                    renderizarGrid(dadosOriginais);
                    statusResultados.textContent = `Exibindo catálogo completo de cultura (0800).`;
                } else {
                    const filtrados = dadosOriginais.filter(i => i.categoria === catEscolhida);
                    renderizarGrid(filtrados);
                    statusResultados.textContent = `Listando apenas opções de ${catEscolhida}.`;
                }
            });
        });
    }

    function renderizarGrid(dados) {
        gridFerramentas.innerHTML = '';
        dados.forEach(item => {
            const card = document.createElement('article');
            card.className = 'card-ferramenta';
            card.innerHTML = `
                <div>
                    <div class="card-cabecalho">
                        <span class="card-emoji" aria-hidden="true">${item.emoji}</span>
                        <span class="card-categoria">${item.categoria}</span>
                    </div>
                    <h3 class="card-titulo">${item.nome}</h3>
                    <p class="card-descricao">${item.descricao.substring(0, 90)}...</p>
                    <div class="card-dor">
                        <strong>💡 O pulo do gato:</strong><br>${item.dor_resolvida}
                    </div>
                </div>
                <div class="card-acoes">
                    <button class="btn-acao btn-detalhes" onclick="abrirModal(${item.id})" aria-haspopup="dialog">Ver Mais</button>
                    <button class="btn-acao btn-compartilhar" onclick="compartilharNative('${item.nome}', '${window.location.origin}${window.location.pathname}?modal=${item.id}')">Indicar</button>
                </div>
            `;
            gridFerramentas.appendChild(card);
        });
    }

    /* =========================================================
       4. BUSCA DINÂMICA (DEBOUNCE + NORMALIZAÇÃO)
       ========================================================= */
    function removerAcentos(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    let timeoutBusca;
    campoBusca.addEventListener('input', (e) => {
        clearTimeout(timeoutBusca);
        const termo = removerAcentos(e.target.value);
        
        timeoutBusca = setTimeout(() => {
            if(termo.trim() === '') {
                renderizarGrid(dadosOriginais);
                statusResultados.textContent = 'Catálogo completo.';
                return;
            }
            
            const resultados = dadosOriginais.filter(item => 
                removerAcentos(item.nome).includes(termo) || 
                removerAcentos(item.descricao).includes(termo) ||
                removerAcentos(item.dor_resolvida).includes(termo)
            );
            renderizarGrid(resultados);
            statusResultados.textContent = `Encontrados ${resultados.length} locais para sua busca.`;
        }, 350); 
    });

    btnLimpar.addEventListener('click', () => {
        campoBusca.value = '';
        renderizarGrid(dadosOriginais);
        statusResultados.textContent = 'Catálogo restaurado.';
        document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
        document.querySelector('.btn-filtro[data-cat="todas"]').classList.add('ativo');
    });

    // Mock da API Programática do Google (GCS)
    btnGoogleBusca.addEventListener('click', () => {
        const termo = campoBusca.value.trim();
        if(termo === '') {
            googleStatus.textContent = "Digite um termo para pesquisar via Google.";
            return;
        }
        googlePanel.classList.remove('hidden');
        googlePanel.setAttribute('aria-hidden', 'false');
        googleResultados.innerHTML = `<p style="color: var(--text-muted)">Painel reservado para injeção do <em>Google Programmable Search Engine</em>. Resultados globais da web para: <strong>${termo}</strong></p>`;
    });

    btnFecharGoogle.addEventListener('click', () => {
        googlePanel.classList.add('hidden');
        googlePanel.setAttribute('aria-hidden', 'true');
    });

    /* =========================================================
       5. COMPARTILHAMENTO (WEB SHARE API)
       ========================================================= */
    window.compartilharNative = async (nome, url) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `0800 eu vou: ${nome}`,
                    text: `Dá uma olhada nesse rolê de graça em BH que eu achei: ${nome}`,
                    url: url
                });
            } catch (err) {
                console.log('Compartilhamento cancelado', err);
            }
        } else {
            navigator.clipboard.writeText(url).then(() => {
                alert('O link direto para este local foi copiado para sua área de transferência!');
            });
        }
    };

    /* =========================================================
       6. HISTORY API (METADADOS DE URL EM TEMPO REAL)
       ========================================================= */
    window.abrirModal = (id) => {
        const item = dadosOriginais.find(i => i.id === id);
        if(!item) return;

        modalCorpo.innerHTML = `
            <h2 id="modal-titulo" style="color: var(--accent-primary); margin-bottom: 5px;">${item.nome}</h2>
            <span class="card-categoria" style="display:inline-block; margin-bottom: 20px;">${item.emoji} ${item.categoria}</span>
            <p style="color: var(--text-main); line-height: 1.6;">${item.descricao}</p>
            <div class="card-dor" style="margin-top: 20px;">
                <strong>Como esse guia facilita a sua vida:</strong><br>${item.dor_resolvida}
            </div>
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: var(--accent-primary); color: #FFF; padding: 15px; border-radius: var(--radius-pill); text-decoration: none; font-weight: bold; margin-top: 30px;">Abrir Site Oficial</a>
        `;
        
        modalOverlay.classList.remove('hidden');
        modalOverlay.setAttribute('aria-hidden', 'false');
        
        // Push State - Muda a URL sem recarregar a página
        const urlAtual = new URL(window.location);
        urlAtual.searchParams.set('modal', id);
        window.history.pushState({ modal: id }, `${item.nome} | 0800 eu vou`, urlAtual);
        document.title = `${item.nome} | 0800 eu vou`;
    };

    function fecharModalLocal() {
        modalOverlay.classList.add('hidden');
        modalOverlay.setAttribute('aria-hidden', 'true');
        
        // Remove param e limpa a rota
        const urlAtual = new URL(window.location);
        urlAtual.searchParams.delete('modal');
        window.history.replaceState({}, document.title, urlAtual);
        document.title = "0800 eu vou | A Cultura de BH pertence a você";
    }

    btnFecharModal.addEventListener('click', fecharModalLocal);
    
    window.fecharAoClicarFora = (e) => {
        if (e.target === modalOverlay) fecharModalLocal();
    };

    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.modal) {
            abrirModal(e.state.modal);
        } else {
            fecharModalLocal();
        }
    });

    function verificarUrlModal() {
        const params = new URLSearchParams(window.location.search);
        const modalId = params.get('modal');
        if (modalId) {
            abrirModal(parseInt(modalId));
        }
    }

    // Gatilho inicial
    carregarDados();
});