document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DO DOM ---
    const form = document.getElementById('form-eletrodomestico');
    const nomeInput = document.getElementById('nome');
    const potenciaInput = document.getElementById('potencia');
    const horasInput = document.getElementById('horas');
    const diasInput = document.getElementById('dias');
    const tarifaInput = document.getElementById('tarifa');
    const bandeiraSelect = document.getElementById('bandeira');
    const listaDiv = document.getElementById('lista-eletrodomesticos');
    const consumoTotalSpan = document.getElementById('consumo-total');
    const custoTotalSpan = document.getElementById('custo-total');
    const presetsSelect = document.getElementById('presets');
    const submitButton = document.getElementById('submit-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const chartCanvas = document.getElementById('consumoChart').getContext('2d');

    // --- DADOS E ESTADO DA APLICAÇÃO ---
    let eletrodomesticos = [];
    let editIndex = null;
    let consumoChart = null;
    
    // Banco de dados de dicas de economia
const DICAS_DE_ECONOMIA = {
    chuveiro: [
        { texto: 'Tome banhos mais curtos. Cada minuto a menos faz uma grande diferença.', icone: 'fa-clock' },
        { texto: 'Nos dias quentes, use a chave na posição "Verão". O consumo pode cair até 30%.', icone: 'fa-temperature-full' },
        { texto: 'Limpe os furos de saída de água do chuveiro regularmente.', icone: 'fa-wrench' }
    ],
    geladeira: [
        { texto: 'Não forre as prateleiras. Isso dificulta a circulação de ar e força o motor a trabalhar mais.', icone: 'fa-ban' },
        { texto: 'Verifique se a borracha de vedação da porta está em bom estado.', icone: 'fa-user-check' },
        { texto: 'Evite colocar alimentos quentes dentro da geladeira.', icone: 'fa-temperature-half' }
    ],
    ar: [ // Para 'Ar Condicionado'
        { texto: 'Mantenha portas e janelas fechadas ao usar o ar condicionado.', icone: 'fa-door-closed' },
        { texto: 'Limpe os filtros regularmente para garantir a eficiência do aparelho.', icone: 'fa-filter' },
        { texto: 'Regule o termostato para uma temperatura confortável, como 23°C.', icone: 'fa-thermometer-half' }
    ],
    luz: [ // Para 'Lâmpada', 'Iluminação'
        { texto: 'Sempre que possível, aproveite a luz natural.', icone: 'fa-sun' },
        { texto: 'Apague as luzes ao sair de um cômodo.', icone: 'fa-power-off' },
        { texto: 'Dê preferência a lâmpadas de LED, que são muito mais econômicas.', icone: 'fa-lightbulb' }
    ],
    standby: [ // Para 'TV', 'Computador', 'Videogame'
        { texto: 'Desligue completamente os aparelhos da tomada quando não estiverem em uso por longos períodos.', icone: 'fa-power-off' },
        { texto: 'O modo "standby" também consome energia. Use filtros de linha com interruptor.', icone: 'fa-bolt' }
    ]
};

    // Valores das bandeiras por kWh (base ANEEL, vigentes em Set/2025 - valores ilustrativos)
    const VALORES_BANDEIRAS = {
        verde: 0,
        amarela: 0.01885,      // R$ 1,885 por 100 kWh
        vermelha1: 0.04463,   // R$ 4,463 por 100 kWh
        vermelha2: 0.07877    // R$ 7,877 por 100 kWh
    };

const PRESETS = [
    { nome: 'Chuveiro Elétrico', potencia: 5500, horas: 0.5, icon: 'fa-shower' },
    { nome: 'Geladeira (Média)', potencia: 150, horas: 8, icon: 'fa-snowflake' },
    { nome: 'Ar Condicionado', potencia: 1000, horas: 8, icon: 'fa-fan' },
    { nome: 'Televisão LED 42"', potencia: 100, horas: 5, icon: 'fa-tv' },
    { nome: 'Micro-ondas', potencia: 1200, horas: 0.2, icon: 'fa-microwave' },
    { nome: 'Lâmpada LED', potencia: 9, horas: 6, icon: 'fa-lightbulb' },
    { nome: 'Computador Desktop', potencia: 300, horas: 4, icon: 'fa-desktop' }
];
    // --- FUNÇÕES ---

    function carregarDoLocalStorage() {
        const dadosSalvos = localStorage.getItem('eletrodomesticosApp');
        if (dadosSalvos) {
            eletrodomesticos = JSON.parse(dadosSalvos);
            renderizarTudo();
        }
    }

    function salvarNoLocalStorage() {
        localStorage.setItem('eletrodomesticosApp', JSON.stringify(eletrodomesticos));
    }

    function renderizarTudo() {
        listaDiv.innerHTML = '';
        if (eletrodomesticos.length === 0) {
            listaDiv.innerHTML = '<p>Nenhum eletrodoméstico adicionado ainda.</p>';
        }

        eletrodomesticos.sort((a, b) => b.consumoMensalKWh - a.consumoMensalKWh);

        let consumoTotal = 0;
        const tarifaBase = parseFloat(tarifaInput.value) || 0;
        const valorBandeira = VALORES_BANDEIRAS[bandeiraSelect.value] || 0;
        const tarifaFinal = tarifaBase + valorBandeira;

        eletrodomesticos.forEach((item, index) => {
            const custoMensalItem = item.consumoMensalKWh * tarifaFinal;
            consumoTotal += item.consumoMensalKWh;
            
            let classeConsumo = 'consumo-baixo';
            if (item.consumoMensalKWh > 50) classeConsumo = 'consumo-alto';
            else if (item.consumoMensalKWh > 15) classeConsumo = 'consumo-medio';
            
            const itemDiv = document.createElement('div');
            itemDiv.className = `eletrodomestico ${classeConsumo}`;
            itemDiv.innerHTML = `
                <div class="icon"><i class="fa-solid ${item.icon || 'fa-plug'}"></i></div>
                <div class="info">
                    <h4>${item.nome} (${item.potencia}W)</h4>
                    <p><strong>Consumo:</strong> ${item.consumoMensalKWh.toFixed(2)} kWh/mês</p>
                    <p><strong>Custo:</strong> ${custoMensalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</p>
                </div>
                <div class="actions">
                    <button class="edit" data-index="${index}" title="Editar"><i class="fa-solid fa-pencil"></i></button>
                    <button class="remove" data-index="${index}" title="Remover"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            listaDiv.appendChild(itemDiv);
        });

        const custoTotal = consumoTotal * tarifaFinal;
        consumoTotalSpan.textContent = `${consumoTotal.toFixed(2)} kWh`;
        custoTotalSpan.textContent = custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        renderizarGrafico();
    }

    function renderizarGrafico() {
        if (consumoChart) {
            consumoChart.destroy();
        }

        const labels = eletrodomesticos.map(item => item.nome);
        const data = eletrodomesticos.map(item => item.consumoMensalKWh);

        consumoChart = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Consumo (kWh)',
                    data: data,
                    backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: eletrodomesticos.length > 0 },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let total = context.chart.getDatasetMeta(0).total;
                                let percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw.toFixed(2)} kWh (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function prepararEdicao(index) {
        editIndex = index;
        const item = eletrodomesticos[index];
        nomeInput.value = item.nome;
        potenciaInput.value = item.potencia;
        horasInput.value = item.horas;
        diasInput.value = item.dias;
        
        submitButton.innerHTML = '<i class="fa-solid fa-save"></i> Salvar Alterações';
        submitButton.classList.add('editing');
        cancelEditButton.classList.remove('hidden');
        form.scrollIntoView({ behavior: 'smooth' });
    }

    function cancelarEdicao() {
        editIndex = null;
        form.reset();
        submitButton.innerHTML = '<i class="fa-solid fa-plus"></i> Adicionar à Lista';
        submitButton.classList.remove('editing');
        cancelEditButton.classList.add('hidden');
        presetsSelect.value = "";
    }
    
    function exibirDicas(nomeAparelho) {
        const dicasContainer = document.getElementById('dicas-container');
        const listaDicas = document.getElementById('lista-dicas');
        const nomeAparelhoSpan = document.getElementById('dica-aparelho-nome');
        
        const nomeLowerCase = nomeAparelho.toLowerCase();
        let dicasEncontradas = null, nomeExibido = nomeAparelho;

        if (nomeLowerCase.includes('chuveiro')) { dicasEncontradas = DICAS_DE_ECONOMIA.chuveiro; nomeExibido = "Chuveiro"; }
        else if (nomeLowerCase.includes('geladeira') || nomeLowerCase.includes('freezer')) { dicasEncontradas = DICAS_DE_ECONOMIA.geladeira; nomeExibido = "Geladeira"; }
        else if (nomeLowerCase.includes('ar condicionado')) { dicasEncontradas = DICAS_DE_ECONOMIA.ar; nomeExibido = "Ar Condicionado"; }
        else if (nomeLowerCase.includes('lâmpada') || nomeLowerCase.includes('luz')) { dicasEncontradas = DICAS_DE_ECONOMIA.luz; nomeExibido = "Iluminação"; }
        else if (nomeLowerCase.includes('tv') || nomeLowerCase.includes('computador') || nomeLowerCase.includes('console')) { dicasEncontradas = DICAS_DE_ECONOMIA.standby; nomeExibido = "Aparelhos em Standby"; }
        
        if (dicasEncontradas) {
            nomeAparelhoSpan.textContent = nomeExibido;
            listaDicas.innerHTML = '';
            dicasEncontradas.forEach(dica => {
                const li = document.createElement('li');
                li.className = 'dica-item';
                li.innerHTML = `<i class="fa-solid ${dica.icone}"></i><span>${dica.texto}</span>`;
                listaDicas.appendChild(li);
            });
            dicasContainer.classList.remove('hidden');
            setTimeout(() => dicasContainer.classList.add('visible'), 10);
        } else {
            dicasContainer.classList.remove('visible');
            dicasContainer.classList.add('hidden');
        }
    }

    function popularPresets() {
        PRESETS.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.nome;
            option.textContent = preset.nome;
            presetsSelect.appendChild(option);
        });
    }

    // --- EVENT LISTENERS ---
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const nome = nomeInput.value;
        const potencia = parseFloat(potenciaInput.value);
        const horas = parseFloat(horasInput.value);
        const dias = parseInt(diasInput.value);

        if (!nome || isNaN(potencia) || isNaN(horas) || isNaN(dias) || potencia <= 0 || horas < 0 || dias <= 0) {
            alert('Por favor, preencha todos os campos com valores válidos.');
            return;
        }

        const consumoMensalKWh = (potencia / 1000) * horas * dias;
        const presetIcon = PRESETS.find(p => p.nome === nome)?.icon || 'fa-plug';
        const novoItem = { nome, potencia, horas, dias, consumoMensalKWh, icon: presetIcon };

        if (editIndex !== null) {
            eletrodomesticos[editIndex] = novoItem;
        } else {
            eletrodomesticos.push(novoItem);
        }
        
        exibirDicas(novoItem.nome);
        salvarNoLocalStorage();
        renderizarTudo();
        cancelarEdicao();
    });

    listaDiv.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        const index = parseInt(target.dataset.index);

        if (target.classList.contains('edit')) prepararEdicao(index);
        else if (target.classList.contains('remove')) {
            if (confirm(`Tem certeza que deseja remover "${eletrodomesticos[index].nome}"?`)) {
                eletrodomesticos.splice(index, 1);
                salvarNoLocalStorage();
                renderizarTudo();
            }
        }
    });

    tarifaInput.addEventListener('input', renderizarTudo);
    bandeiraSelect.addEventListener('change', renderizarTudo);
    cancelEditButton.addEventListener('click', cancelarEdicao);

    presetsSelect.addEventListener('change', () => {
        const selectedPreset = PRESETS.find(p => p.nome === presetsSelect.value);
        if (selectedPreset) {
            nomeInput.value = selectedPreset.nome;
            potenciaInput.value = selectedPreset.potencia;
            horasInput.value = selectedPreset.horas;
        }
    });

    document.getElementById('fechar-dicas').addEventListener('click', () => {
        const dicasContainer = document.getElementById('dicas-container');
        dicasContainer.classList.remove('visible');
        dicasContainer.classList.add('hidden');
    });

    // --- INICIALIZAÇÃO ---
    popularPresets();
    carregarDoLocalStorage();
});








