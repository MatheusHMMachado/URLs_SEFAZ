const selectEstado = document.getElementById('estado');
const resultadoDiv = document.getElementById('resultado');
let dadosPorEstado = {};

async function carregarDados() {
  try {
    const response = await fetch('data/urlsComunicacao.txt');
    const texto = await response.text();

    const linhas = texto.split('\n');

    linhas.forEach((linha, index) => {
      linha = linha.trim();
      if (!linha) return;

      // Regex para capturar: (UF)Tipo_Ambiente: URL
      const match = linha.match(/^\((\w{2})\)([^:]+):\s*(.+)$/i);
      if (!match) {
        console.warn(`Linha ignorada [${index}]:`, linha);
        return;
      }

      const sigla = match[1].toUpperCase();
      const tipoCompleto = match[2].trim(); // Ex: Consulta_Homologacao/Producao
      const url = match[3].trim();

      // Separar tipo e ambiente (separados por underline ou apenas tipo para Homologacao/Producao)
      let tipo = '';
      let ambiente = 'Homologacao/Producao';

      if (tipoCompleto.includes('_')) {
        const partes = tipoCompleto.split('_');
        tipo = partes[0].trim();
        ambiente = partes[1].trim();
      } else {
        tipo = tipoCompleto.trim();
      }

      // Normalizar nomes
      tipo = normalizarTipo(tipo);
      ambiente = normalizarAmbiente(ambiente);

      // Criar estrutura
      if (!dadosPorEstado[sigla]) {
        dadosPorEstado[sigla] = {};
      }
      if (!dadosPorEstado[sigla][tipo]) {
        dadosPorEstado[sigla][tipo] = {};
      }
      if (!dadosPorEstado[sigla][tipo][ambiente]) {
        dadosPorEstado[sigla][tipo][ambiente] = [];
      }

      dadosPorEstado[sigla][tipo][ambiente].push(url);
    });

    // Preencher select com as siglas
    Object.keys(dadosPorEstado).sort().forEach(sigla => {
      const option = document.createElement('option');
      option.value = sigla;
      option.textContent = sigla;
      selectEstado.appendChild(option);
    });

  } catch (erro) {
    resultadoDiv.innerHTML = `<p style="color: red;">Erro ao carregar dados: ${erro.message}</p>`;
    resultadoDiv.style.display = 'block';
  }
}

// Normaliza o nome do grupo
function normalizarTipo(tipo) {
  const mapa = {
    consulta: "Consulta",
    autorizacao: "Autorizacao",
    retautorizacao: "RetAutorizacao",
    inutilizacao: "Inutilizacao",
    statusservico: "StatusServico",
    recepcaoevento: "RecepcaoEvento"
  };
  return mapa[tipo.toLowerCase()] || tipo;
}

// Normaliza o nome do ambiente
function normalizarAmbiente(ambiente) {
  const mapa = {
    producao: "Producao",
    homologacao: "Homologacao",
    "homologacao/producao": "Homologacao/Producao"
  };
  return mapa[ambiente.toLowerCase()] || ambiente;
}

// Quando muda o estado
selectEstado.addEventListener('change', () => {
  const sigla = selectEstado.value;
  resultadoDiv.innerHTML = '';
  resultadoDiv.style.display = 'none';

  if (!sigla || !dadosPorEstado[sigla]) return;

  const tipos = dadosPorEstado[sigla];
  let html = `<h3>URLs para ${sigla}</h3>`;

  Object.entries(tipos).forEach(([tipo, ambientes]) => {
    html += `<h4>${tipo}</h4><ul>`;
    Object.entries(ambientes).forEach(([ambiente, urls]) => {
      html += `<li><strong>${ambiente}:</strong><ul>`;
      urls.forEach(url => {
        const href = url.startsWith('http') ? url : `https://${url}`;
        html += `<li><a>${url}</a></li>`;
      });
      html += `</ul></li>`;
    });
    html += `</ul>`;
  });

  resultadoDiv.innerHTML = html;
  resultadoDiv.style.display = 'block';
});

carregarDados();