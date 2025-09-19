// Aguarda o DOM estar completamente carregado para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // Seleciona os elementos do HTML com os quais vamos interagir
    const form = document.getElementById('form-eletrodomestico');
    const nomeInput = document.getElementById('nome');
    const potenciaInput = document.getElementById('potencia');
    const horasInput = document.getElementById('horas');
    const diasInput = document.getElementById('dias');
    const tarifaInput = document.getElementById('tarifa');
    const listaDiv = document.getElementById('lista-eletrodomesticos');
    const consumoTotalSpan = document.getElementById('consumo-total');
    const custoTotalSpan = document.getElementById('custo-total');

    // Array para armazenar os objetos de cada eletrodoméstico
    let eletrodomesticos = [];

    // Função principal que redesenha a lista e os totais na tela
    function renderizarLista() {
        // Limpa a lista atual para não duplicar itens
        listaDiv.innerHTML = '';

        // Ordena a lista do maior consumo para o menor
        eletrodomesticos.sort((a, b) => b.consumoMensalKWh - a.consumoMensalKWh);

        let consumoTotal = 0;
        let custoTotal = 0;
        const tarifa = parseFloat(tarifaInput.value) || 0;

        // Itera sobre cada item da lista para criar seu HTML
        eletrodomesticos.forEach((item, index) => {
            // Calcula o custo individual do item
            const custoMensalItem = item.consumoMensalKWh * tarifa;

            // Acumula os totais
            consumoTotal += item.consumoMensalKWh;
            custoTotal += custoMensalItem;
            
            // Define a classe de cor baseada no consumo em kWh
            // Estes valores podem ser ajustados conforme sua necessidade
            let classeConsumo = 'consumo-baixo'; // Verde (padrão)
            if (item.consumoMensalKWh > 50) {
                classeConsumo = 'consumo-alto'; // Vermelho
            } else if (item.consumoMensalKWh > 15) {
                classeConsumo = 'consumo-medio'; // Amarelo
            }

            // Cria o elemento div para o eletrodoméstico
            const itemDiv = document.createElement('div');
            itemDiv.className = `eletrodomestico ${classeConsumo}`;
            
            // Define o conteúdo HTML do item
            itemDiv.innerHTML = `
                <div class="info">
                    <h4>${item.nome} (${item.potencia}W)</h4>
                    <p><strong>Consumo:</strong> ${item.consumoMensalKWh.toFixed(2)} kWh/mês</p>
                    <p><strong>Custo:</strong> ${custoMensalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</p>
                </div>
                <button class="remover" data-index="${index}">Remover</button>
            `;

            // Adiciona o item criado à lista na página
            listaDiv.appendChild(itemDiv);
        });

        // Adiciona os event listeners para os novos botões de remover
        document.querySelectorAll('.remover').forEach(button => {
            button.addEventListener('click', (event) => {
                const indexParaRemover = parseInt(event.target.getAttribute('data-index'));
                removerEletrodomestico(indexParaRemover);
            });
        });

        // Atualiza os totais na tela
        consumoTotalSpan.textContent = `${consumoTotal.toFixed(2)} kWh`;
        custoTotalSpan.textContent = custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Função para adicionar um novo eletrodoméstico
    function adicionarEletrodomestico(event) {
        event.preventDefault(); // Impede o recarregamento da página ao enviar o formulário

        // Pega os valores dos inputs e converte para número
        const nome = nomeInput.value;
        const potencia = parseFloat(potenciaInput.value);
        const horas = parseFloat(horasInput.value);
        const dias = parseInt(diasInput.value);

        // Validação simples
        if (!nome || isNaN(potencia) || isNaN(horas) || isNaN(dias)) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        // Cálculo do consumo: (Potência em W / 1000) * Horas de uso * Dias de uso
        const consumoMensalKWh = (potencia / 1000) * horas * dias;

        // Cria o objeto do novo eletrodoméstico
        const novoEletrodomestico = {
            nome,
            potencia,
            horas,
            dias,
            consumoMensalKWh
        };

        // Adiciona o novo item ao nosso array de dados
        eletrodomesticos.push(novoEletrodomestico);

        // Limpa os campos do formulário
        form.reset();
        nomeInput.focus();

        // Chama a função para redesenhar tudo na tela
        renderizarLista();
    }

    // Função para remover um item da lista
    function removerEletrodomestico(index) {
        // Remove 1 item a partir do índice especificado
        eletrodomesticos.splice(index, 1);
        // Redesenha a lista atualizada
        renderizarLista();
    }

    // Adiciona os "escutadores" de eventos
    form.addEventListener('submit', adicionarEletrodomestico);
    tarifaInput.addEventListener('input', renderizarLista); // Atualiza os custos quando a tarifa muda
});