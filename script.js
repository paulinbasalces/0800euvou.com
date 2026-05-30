document.addEventListener('DOMContentLoaded', () => {
    let baseDeDados = [];
    let categoriaAtiva = 'Todas';
    const htmlElement = document.documentElement;
    const SITE_URL = 'https://0800euvou.com/';

    // --- Acessibilidade: Tema e Fonte ---
    const temaSalvo = localStorage.getItem('tema');
    if (temaSalvo === 'dark') htmlElement.setAttribute('data-theme', 'dark');

    document.getElementById('btn-tema').addEventListener('click', () => {
        if (htmlElement.getAttribute('data-theme') === 'dark') {
            htmlElement.removeAttribute('data-theme');
            localStorage.setItem('tema', 'light');
        } else {
            htmlElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('tema', 'dark');
        }
    });

    let fontScale = parseInt(localStorage.getItem('fontScale'), 10) || 100;
    const atualizarFonte = () => {
        htmlElement.style.fontSize = fontScale + '%';
        localStorage.setItem('fontScale', fontScale);
    };
    atualizarFonte();

    document.getElementById('btn-fonte-mais').addEventListener('click', () => {
        if (fontScale < 130) {
            fontScale += 10;
            atualizarFonte();
        }
    });

    document.getElementById('btn-fonte-menos').addEventListener('click', () => {
        if (fontScale > 90) {
            fontScale -= 10;
            atualizarFonte();
        }
    });
    // ------------------------------------

    // --- Metadados Editoriais (Específico 0800 eu vou) ---
    const categoriasMeta = {
        'Museus e Galerias': { melhorPara: 'Quem curte explorar exposições e arquitetura histórica sem pressa.', cuidado: 'Muitos museus exigem retirada prévia de ingressos gratuitos online para evitar filas.' },
        'Parques e Praças': { melhorPara: 'Famílias, piqueniques e atividades ao ar livre no final de semana.', cuidado: 'Atenção aos horários de fechamento e regras para entrada com animais de estimação.' },
        'Cinemas e Teatros': { melhorPara: 'Programação noturna e mostras culturais independentes.', cuidado: 'A lotação é limitada. Os ingressos gratuitos geralmente esgotam 1 hora antes da sessão.' },
        'Festivais de Rua': { melhorPara: 'Quem gosta de muvuca, música ao vivo e gastronomia popular.', cuidado: 'Eventos sazonais podem sofrer alterações por conta de chuvas. Confirme no Instagram oficial.' },
        'Centros Culturais': { melhorPara: 'Oficinas gratuitas, bibliotecas públicas e eventos literários.', cuidado: 'Algumas oficinas gratuitas exigem inscrição prévia via formulário durante a semana.' }
    };

    const seletor = {
        busca: document.getElementById('campo-busca'),
        limparBusca: document.getElementById('btn-limpar-busca'),
        bentoMenu: document.getElementById('bento-menu'),
        listaFerramentas: document.getElementById('lista-ferramentas'),
        statusResultados: document.getElementById('status-resultados')
    };

    fetch('dados.json')
        .then(res => {
            if (!res.ok) throw new Error('Falha no JSON');
            return res.json();
        })
        .then(data => {
            baseDeDados = data || [];
            document.getElementById('total-ferramentas').textContent = baseDeDados.length;
            document.getElementById('total-categorias').textContent = new Set(baseDeDados.map(i => i.categoria)).size;
            renderizarFiltros(baseDeDados);
            renderizarInterface();
            aplicarBuscaDaUrl();
            abrirFerramentaDaUrl();
        })
        .catch(erro => {
            seletor.listaFerramentas.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">Erro ao carregar o diretório cultural. Verifique o arquivo JSON.</div>';
        });

    seletor.busca.addEventListener('input', () => {
        atualizarParametroBusca();
        renderizarInterface();
    });

    seletor.limparBusca.addEventListener('click', () => {
        seletor.busca.value = '';
        categoriaAtiva = 'Todas';
        atualizarUrl({ q: null, modal: null });
        renderizarFiltros(baseDeDados);
        renderizarInterface();
    });

    function renderizarFiltros(ferramentas) {
        const categorias = ['Todas', ...new Set(ferramentas.map(item => item.categoria))];
        seletor.bentoMenu.innerHTML = categorias.map(categoria => {
            const ativo = categoria === categoriaAtiva ? 'true' : 'false';
            const emoji = categoria === 'Todas' ? '📍' : ferramentas.find(item => item.categoria === categoria)?.emoji;
            const total = categoria === 'Todas' ? ferramentas.length : ferramentas.filter(item => item.categoria === categoria).length;

            return `
                <button type="button" class="bento-card" data-categoria="${categoria}" aria-pressed="${ativo}">
                    <span class="bento-emoji" aria-hidden="true">${emoji || '📍'}</span>
                    <span class="bento-title">${categoria}</span>
                    <span class="bento-count">${total}</span>
                </button>
            `;
        }).join('');

        seletor.bentoMenu.querySelectorAll('.bento-card').forEach(botao => {
            botao.addEventListener('click', () => {
                categoriaAtiva = botao.dataset.categoria;
                renderizarFiltros(baseDeDados);
                renderizarInterface();
                document.getElementById('lista-ferramentas').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    function renderizarInterface() {
        const termo = seletor.busca.value.trim().toLowerCase();
        const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const termoNorm = normalizar(termo);
        
        const filtradas = baseDeDados.filter(item => {
            const matchTexto = termo === '' || 
                               normalizar(item.nome.toLowerCase()).includes(termoNorm) || 
                               normalizar(item.dor_resolvida.toLowerCase()).includes(termoNorm) || 
                               normalizar(item.descricao.toLowerCase()).includes(termoNorm);
            const matchCat = categoriaAtiva === 'Todas' || item.categoria === categoriaAtiva;
            return matchTexto && matchCat;
        });

        seletor.statusResultados.textContent = `${filtradas.length} de ${baseDeDados.length} locais disponíveis exibidos.`;

        if (!filtradas.length) {
            seletor.listaFerramentas.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhum local encontrado com este perfil.</div>';
            return;
        }

        const categoriasInfo = filtradas.reduce((acc, item) => {
            if (!acc[item.categoria]) acc[item.categoria] = [];
            acc[item.categoria].push(item);
            return acc;
        }, {});

        seletor.listaFerramentas.innerHTML = Object.keys(categoriasInfo).map((categoria, index, arr) => {
            const itens = categoriasInfo[categoria];
            const cards = itens.map(item => `
                <article class="card">
                    <div class="card-conteudo">
                        <div class="card-topo">
                            <span class="card-emoji">${item.emoji}</span>
                            <span class="card-tag">${item.categoria}</span>
                        </div>
                        <h3>${item.nome}</h3>
                        <p class="card-desc">${item.dor_resolvida}</p>
                        <p class="card-editorial">${item.descricao}</p>
                    </div>
                    <div class="card-footer">
                        <button type="button" class="btn-card-abrir" onclick="abrirModalFerramenta('${item.id}')">Dicas de Acesso</button>
                        <a class="link-card-oficial" href="${item.url}" target="_blank" rel="noopener noreferrer">Site oficial ➔</a>
                    </div>
                </article>
            `).join('');

            // AdSense In-feed (A cada categoria/seção, injeta publicidade para manter o CLS intacto)
            const ad = index < arr.length - 1 ? `<div class="area-adsense ads-home"><p class="ads-label">Publicidade</p></div>` : '';

            return `
                <section class="sessao-categoria">
                    <h2 class="sessao-titulo">${itens[0].emoji} ${categoria}</h2>
                    <div class="grid-cards">${cards}</div>
                </section>
                ${ad}
            `;
        }).join('');
    }

    window.abrirModalFerramenta = function(id, alterarUrl = true) {
        // Suporta IDs como strings (ex: "museu-artes") ou numéricos
        const ferramenta = baseDeDados.find(item => String(item.id) === String(id));
        if (!ferramenta) return;

        const meta = categoriasMeta[ferramenta.categoria] || { melhorPara: "Todo belorizontino que quer aproveitar a cidade.", cuidado: "Confirme a programação atualizada no site oficial antes de sair de casa." };
        
        document.getElementById('artigo-emoji').textContent = ferramenta.emoji;
        document.getElementById('artigo-categoria').textContent = ferramenta.categoria;
        document.getElementById('artigo-titulo').textContent = ferramenta.nome;
        document.getElementById('artigo-dor').textContent = ferramenta.dor_resolvida;
        document.getElementById('artigo-descricao').textContent = ferramenta.descricao;
        document.getElementById('artigo-melhor-para').textContent = meta.melhorPara;
        document.getElementById('artigo-cuidado').textContent = meta.cuidado;
        document.getElementById('artigo-link').href = ferramenta.url;

        renderizarCompartilhamento(ferramenta);

        document.getElementById('modal-overlay').classList.remove('hidden');
        document.body.classList.add('modal-open');

        if (alterarUrl) atualizarUrl({ modal: ferramenta.id });
    };

    window.fecharTodosModais = function() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.body.classList.remove('modal-open');
        atualizarUrl({ modal: null });
    };

    window.fecharAoClicarFora = function(event) {
        if (event.target.id === 'modal-overlay') fecharTodosModais();
    };

    function renderizarCompartilhamento(ferramenta) {
        const container = document.getElementById('botoes-compartilhamento');
        container.innerHTML = '';
        
        const urlCompartilhamento = `${SITE_URL}?modal=${ferramenta.id}`;
        
        if (navigator.share && window.innerWidth <= 768) {
            const btn = document.createElement('button');
            btn.className = 'btn-share native';
            btn.textContent = 'Compartilhar Rolê';
            btn.onclick = () => navigator.share({ title: ferramenta.nome, text: ferramenta.dor_resolvida, url: urlCompartilhamento });
            container.appendChild(btn);
        } else {
            const btnCopiar = document.createElement('button');
            btnCopiar.className = 'btn-share native';
            btnCopiar.textContent = 'Copiar link deste local';
            btnCopiar.onclick = () => {
                navigator.clipboard.writeText(urlCompartilhamento);
                btnCopiar.textContent = 'Copiado!';
                setTimeout(() => btnCopiar.textContent = 'Copiar link deste local', 2000);
            };
            container.appendChild(btnCopiar);
        }
    }

    function atualizarUrl(params, substituir = false) {
        const url = new URL(window.location.href);
        Object.entries(params).forEach(([chave, valor]) => {
            if (valor) url.searchParams.set(chave, valor);
            else url.searchParams.delete(chave);
        });
        const metodo = substituir ? 'replaceState' : 'pushState';
        window.history[metodo]({}, '', url);
    }

    function atualizarParametroBusca() {
        atualizarUrl({ q: seletor.busca.value || null, modal: null }, true);
    }

    function aplicarBuscaDaUrl() {
        const termo = new URL(window.location.href).searchParams.get('q');
        if (termo) { seletor.busca.value = termo; renderizarInterface(); }
    }

    function abrirFerramentaDaUrl() {
        const ferramenta = new URL(window.location.href).searchParams.get('modal') || new URL(window.location.href).searchParams.get('ferramenta');
        if (ferramenta) window.abrirModalFerramenta(ferramenta, false);
    }
});