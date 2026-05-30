document.addEventListener('DOMContentLoaded', () => {
    let baseDeDados = [];
    let categoriaAtiva = 'Todas';
    const htmlElement = document.documentElement;

    /* Acessibilidade: Tema e Tamanho de Fonte */
    if (localStorage.getItem('tema') === 'dark') htmlElement.setAttribute('data-theme', 'dark');
    document.getElementById('btn-tema').addEventListener('click', () => {
        const isDark = htmlElement.getAttribute('data-theme') === 'dark';
        htmlElement.toggleAttribute('data-theme', !isDark);
        localStorage.setItem('tema', isDark ? 'light' : 'dark');
    });

    let fontScale = parseInt(localStorage.getItem('fontScale'), 10) || 100;
    const atualizarFonte = () => { 
        htmlElement.style.fontSize = fontScale + '%'; 
        localStorage.setItem('fontScale', fontScale); 
    };
    atualizarFonte();
    
    document.getElementById('btn-fonte-mais').addEventListener('click', () => { 
        if(fontScale < 130) { fontScale += 10; atualizarFonte(); } 
    });
    
    document.getElementById('btn-fonte-menos').addEventListener('click', () => { 
        if(fontScale > 90) { fontScale -= 10; atualizarFonte(); } 
    });

    /* Fetch de Dados e Inicialização */
    fetch('dados.json')
        .then(res => res.json())
        .then(data => {
            baseDeDados = data || [];
            document.getElementById('total-ferramentas').textContent = baseDeDados.length;
            document.getElementById('total-categorias').textContent = new Set(baseDeDados.map(i => i.categoria)).size;
            
            renderizarFiltros();
            renderizarInterface();
            abrirModalDaUrl();
        })
        .catch(err => {
            document.getElementById('lista-ferramentas').innerHTML = '<p style="text-align:center; color: var(--accent-primary); font-weight: bold;">Ocorreu um erro ao carregar os dados culturais. Verifique sua conexão ou tente novamente mais tarde.</p>';
        });

    /* Sistema de Busca e Filtros */
    document.getElementById('campo-busca').addEventListener('input', () => { 
        atualizarUrlParam('q', document.getElementById('campo-busca').value); 
        renderizarInterface(); 
    });
    
    document.getElementById('btn-limpar-busca').addEventListener('click', () => { 
        document.getElementById('campo-busca').value = ''; 
        categoriaAtiva = 'Todas'; 
        atualizarUrlParam('q', null); 
        renderizarFiltros(); 
        renderizarInterface(); 
    });

    function renderizarFiltros() {
        const cats = ['Todas', ...new Set(baseDeDados.map(i => i.categoria))];
        const container = document.getElementById('bento-menu');
        
        container.innerHTML = cats.map(cat => {
            const ativo = cat === categoriaAtiva ? 'true' : 'false';
            const total = cat === 'Todas' ? baseDeDados.length : baseDeDados.filter(i => i.categoria === cat).length;
            return `<button type="button" class="bento-card" data-cat="${cat}" aria-pressed="${ativo}"><span>${cat}</span> <strong>(${total})</strong></button>`;
        }).join('');
        
        container.querySelectorAll('.bento-card').forEach(btn => btn.addEventListener('click', (e) => {
            categoriaAtiva = btn.dataset.cat; 
            renderizarFiltros(); 
            renderizarInterface();
        }));
    }

    function renderizarInterface() {
        const inputBusca = document.getElementById('campo-busca').value;
        const termo = inputBusca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const filtradas = baseDeDados.filter(item => {
            const strBusca = (item.nome + " " + item.dor_resolvida + " " + item.descricao).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const textMatch = termo === '' || strBusca.includes(termo);
            const catMatch = categoriaAtiva === 'Todas' || item.categoria === categoriaAtiva;
            return textMatch && catMatch;
        });

        document.getElementById('status-resultados').textContent = `${filtradas.length} rolês encontrados.`;
        const container = document.getElementById('lista-ferramentas');
        
        if (!filtradas.length) { 
            container.innerHTML = '<p style="text-align:center; font-weight: 600; padding: 40px;">Poxa, não encontramos nenhum rolê com esse termo. Tente buscar por bairro, museu ou estilo!</p>'; 
            return; 
        }

        const grupos = filtradas.reduce((acc, obj) => { 
            (acc[obj.categoria] = acc[obj.categoria] || []).push(obj); 
            return acc; 
        }, {});
        
        container.innerHTML = Object.keys(grupos).map((cat, idx, arr) => {
            const cards = grupos[cat].map(item => `
                <article class="card">
                    <div class="card-topo">
                        <span class="card-emoji" aria-hidden="true">${item.emoji}</span>
                        <span class="card-tag">${item.categoria}</span>
                    </div>
                    <h3>${item.nome}</h3>
                    <p class="card-desc">${item.dor_resolvida}</p>
                    <p class="card-editorial">${item.descricao}</p>
                    <div class="card-footer">
                        <button class="btn-card-abrir" onclick="abrirModal('${item.id}')" aria-label="Ver detalhes de ${item.nome}">Ver Detalhes</button>
                        <a class="link-card-oficial" href="${item.url}" target="_blank" rel="noopener noreferrer">Acessar Oficial ➔</a>
                    </div>
                </article>
            `).join('');
            
            const ad = idx < arr.length - 1 ? `<div class="area-adsense"><p class="ads-label">Publicidade / Parcerias Culturais</p></div>` : '';
            
            return `<section class="sessao-categoria"><h2 class="sessao-titulo">${cat}</h2><div class="grid-cards">${cards}</div></section>${ad}`;
        }).join('');
    }

    /* Sistema de Modais e History API para Compartilhamento */
    window.abrirModal = function(id) {
        const item = baseDeDados.find(i => String(i.id) === String(id));
        if(!item) return;
        
        document.getElementById('artigo-emoji').textContent = item.emoji;
        document.getElementById('artigo-titulo').textContent = item.nome;
        document.getElementById('artigo-categoria').textContent = item.categoria;
        document.getElementById('artigo-dor').textContent = item.dor_resolvida;
        document.getElementById('artigo-descricao').textContent = item.descricao;
        
        // Estratégia de dados de apoio mapeada para o contexto BH:
        document.getElementById('artigo-melhor-para').textContent = 'Próximo a pontos do MOVE, linhas circulares ou metrô. Sempre prefira transporte público nos fins de semana.';
        document.getElementById('artigo-cuidado').textContent = 'Horários sujeitos a lotação. Confirme no site oficial antes de sair de casa.';
        
        document.getElementById('artigo-link').href = item.url;
        
        const btnShare = document.getElementById('botoes-compartilhamento');
        btnShare.innerHTML = `<button type="button" class="btn-share" onclick="compartilhar('${item.nome}', '${item.id}')">Copiar Link / Enviar no WhatsApp</button>`;
        
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Evita scroll do fundo
        
        atualizarUrlParam('modal', item.id);
        
        // Foco de acessibilidade no fechar modal
        document.getElementById('fechar-modal').focus();
    };

    const fecharModalFunc = () => {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.body.style.overflow = '';
        atualizarUrlParam('modal', null);
    };

    document.getElementById('fechar-modal').addEventListener('click', fecharModalFunc);
    
    document.getElementById('modal-overlay').addEventListener('click', (e) => { 
        if(e.target.id === 'modal-overlay') fecharModalFunc(); 
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !document.getElementById('modal-overlay').classList.contains('hidden')) {
            fecharModalFunc();
        }
    });

    /* Utilitários Gerais */
    function atualizarUrlParam(key, value) {
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
        window.history.replaceState({}, '', url);
    }

    function abrirModalDaUrl() {
        const params = new URLSearchParams(window.location.search);
        const modalId = params.get('modal');
        if (modalId) {
            // Pequeno delay para garantir que a base de dados terminou de ser populada via fetch assíncrono
            setTimeout(() => window.abrirModal(modalId), 100); 
        }
        const busca = params.get('q');
        if (busca) {
            document.getElementById('campo-busca').value = busca;
            renderizarInterface();
        }
    }

    window.compartilhar = async function(nome, id) {
        const url = `${window.location.origin}${window.location.pathname}?modal=${id}`;
        if (navigator.share) {
            try { 
                await navigator.share({ 
                    title: `Rolê 0800 em BH: ${nome}`, 
                    text: `Bora de graça? Dá uma olhada nesse rolê no 0800 Eu Vou!`,
                    url: url 
                }); 
            } catch(err) {
                console.log("Compartilhamento cancelado ou falhou.", err);
            }
        } else {
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copiado com sucesso! Pode colar no seu grupo.');
            });
        }
    };
});