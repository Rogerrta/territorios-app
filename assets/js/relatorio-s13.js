// ========================================
// RELATÓRIO S-13
// Registro de Designação de Território
// ========================================

let territoriosS13 = [];


// ========================================
// ELEMENTOS
// ========================================

const serviceYear =
  document.getElementById(
    "serviceYear"
  );

const s13Body =
  document.getElementById(
    "s13Body"
  );

const printButton =
  document.getElementById(
    "printButton"
  );


// ========================================
// CARREGAMENTO
// ========================================

async function carregarRelatorio() {

  try {

    const resposta =
      await fetch(
        "data/territorios.json"
      );


    if (!resposta.ok) {

      throw new Error(
        "Não foi possível carregar os territórios."
      );

    }


    territoriosS13 =
      await resposta.json();


    // Usa os dados atuais do aplicativo
    // caso existam no localStorage.

    const dadosLocais =
      localStorage.getItem(
        "territorios"
      );


    if (dadosLocais) {

      try {

        const dados =
          JSON.parse(
            dadosLocais
          );


        if (
          Array.isArray(dados)
        ) {

          territoriosS13 =
            dados;

        }

      } catch (erro) {

        console.warn(
          "Não foi possível ler os dados locais.",
          erro
        );

      }

    }


    preencherAnosServico();

    renderizarRelatorio();


  } catch (erro) {

    console.error(
      "Erro ao carregar S-13:",
      erro
    );


    mostrarErro();

  }

}


// ========================================
// ANO DE SERVIÇO
// ========================================

function obterAnoServicoAtual() {

  const hoje =
    new Date();


  const ano =
    hoje.getFullYear();


  const mes =
    hoje.getMonth() + 1;


  // Ano de serviço:
  // setembro até agosto.

  if (mes >= 9) {

    return (
      `${ano}/${ano + 1}`
    );

  }


  return (
    `${ano - 1}/${ano}`
  );

}


function preencherAnosServico() {

  if (!serviceYear) {
    return;
  }


  const atual =
    obterAnoServicoAtual();


  const [
    inicioAtual
  ] =
    atual
      .split("/")
      .map(Number);


  serviceYear.innerHTML =
    "";


  // Ano anterior, atual
  // e dois anos seguintes.

  for (
    let inicio =
      inicioAtual - 1;

    inicio <=
      inicioAtual + 2;

    inicio++
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      `${inicio}/${inicio + 1}`;


    option.textContent =
      `${inicio}/${inicio + 1}`;


    if (
      option.value === atual
    ) {

      option.selected =
        true;

    }


    serviceYear.appendChild(
      option
    );

  }

}


// ========================================
// LIMITES DO ANO DE SERVIÇO
// ========================================

function obterPeriodoAnoServico(
  anoServico
) {

  const partes =
    anoServico
      .split("/")
      .map(Number);


  if (
    partes.length !== 2
    ||
    partes.some(
      numero =>
        Number.isNaN(numero)
    )
  ) {

    return null;

  }


  const inicio =
    `${partes[0]}-09-01`;


  const fim =
    `${partes[1]}-08-31`;


  return {
    inicio,
    fim
  };

}


// ========================================
// DATA DENTRO DO ANO DE SERVIÇO
// ========================================

function dataPertenceAoAno(
  data,
  anoServico
) {

  if (!data) {
    return false;
  }


  const periodo =
    obterPeriodoAnoServico(
      anoServico
    );


  if (!periodo) {
    return false;
  }


  return (
    data >= periodo.inicio
    &&
    data <= periodo.fim
  );

}


// ========================================
// FORMATAÇÃO DE DATA
// ========================================

function formatarDataS13(
  data
) {

  if (!data) {
    return "";
  }


  const partes =
    data.split("-");


  if (
    partes.length !== 3
  ) {

    return data;

  }


  const [
    ano,
    mes,
    dia
  ] = partes;


  return (
    `${dia}/${mes}/${ano}`
  );

}


// ========================================
// MOVIMENTAÇÕES DO TERRITÓRIO
// ========================================

function obterMovimentacoes(
  territorio,
  anoServico
) {

  const movimentacoes =
    [];


  // ------------------------------------
  // Histórico concluído
  // ------------------------------------

  if (
    Array.isArray(
      territorio.historico
    )
  ) {

    territorio.historico.forEach(
      item => {

        if (
          !item ||
          !item.dataDesignacao
        ) {

          return;

        }


        if (
          dataPertenceAoAno(
            item.dataDesignacao,
            anoServico
          )
        ) {

          movimentacoes.push({

            responsavel:
              item.responsavel
              ||
              "",

            dataDesignacao:
              item.dataDesignacao,

            dataConclusao:
              item.dataConclusao
              ||
              null,

            ativa:
              false

          });

        }

      }
    );

  }


  // ------------------------------------
  // Designação atualmente em uso
  // ------------------------------------

  if (
    (
      territorio.status ===
        "uso"
      ||
      territorio.status ===
        "atencao"
    )
    &&
    territorio.dataDesignacao
    &&
    dataPertenceAoAno(
      territorio.dataDesignacao,
      anoServico
    )
  ) {

    const jaExiste =
      movimentacoes.some(
        item =>
          item.dataDesignacao ===
            territorio.dataDesignacao
          &&
          item.responsavel ===
            territorio.responsavel
          &&
          !item.dataConclusao
      );


    if (!jaExiste) {

      movimentacoes.push({

        responsavel:
          territorio.responsavel
          ||
          "",

        dataDesignacao:
          territorio.dataDesignacao,

        dataConclusao:
          null,

        ativa:
          true

      });

    }

  }


  // Mais antigas primeiro.

  movimentacoes.sort(
    (a, b) => {

      return (
        a.dataDesignacao
          .localeCompare(
            b.dataDesignacao
          )
      );

    }
  );


  return movimentacoes;

}


// ========================================
// ÚLTIMA DATA CONCLUÍDA
// ========================================

function obterUltimaConclusao(
  territorio,
  anoServico
) {

  const periodo =
    obterPeriodoAnoServico(
      anoServico
    );


  if (!periodo) {
    return null;
  }


  const conclusoes = [];


  // Procura todas as conclusões
  // registradas no histórico.

  if (
    Array.isArray(
      territorio.historico
    )
  ) {

    territorio.historico.forEach(
      item => {

        if (
          item &&
          item.dataConclusao &&
          item.dataConclusao <= periodo.fim
        ) {

          conclusoes.push(
            item.dataConclusao
          );

        }

      }
    );

  }


  // Compatibilidade com território
  // que possua ultimaConclusao salva.

  if (
    territorio.ultimaConclusao &&
    territorio.ultimaConclusao <= periodo.fim
  ) {

    conclusoes.push(
      territorio.ultimaConclusao
    );

  }


  if (
    conclusoes.length === 0
  ) {

    return null;

  }


  // Como usamos YYYY-MM-DD,
  // a ordenação textual funciona
  // cronologicamente.

  conclusoes.sort();


  return conclusoes[
    conclusoes.length - 1
  ];

}

// ========================================
// CÉLULA DE MOVIMENTAÇÃO
// ========================================

function criarCelulaMovimentacao(
  movimentacao,
  indice
) {

  const classes =
    [
      "s13-group-start",
      "s13-group-end"
    ];


  if (!movimentacao) {

    return `

      <td
        colspan="2"
        class="${classes.join(" ")}"
      >

        <div class="s13-assignment">

          <div
            class="s13-assignment-name"
          >
            &nbsp;
          </div>

          <div
            class="s13-assignment-date"
          >
            &nbsp;
          </div>

          <div
            class="s13-assignment-date"
          >
            &nbsp;
          </div>

        </div>

      </td>

    `;

  }


  const nome =
    escaparHTML(
      movimentacao.responsavel
      ||
      ""
    );


  const dataDesignacao =
    formatarDataS13(
      movimentacao.dataDesignacao
    );


  const dataConclusao =
    formatarDataS13(
      movimentacao.dataConclusao
    );


  return `

    <td
      colspan="2"
      class="${classes.join(" ")}"
    >

      <div class="s13-assignment">

        <div
          class="s13-assignment-name"
          title="${nome}"
        >
          ${nome}
        </div>

        <div
          class="s13-assignment-date"
        >
          ${dataDesignacao}
        </div>

        <div
          class="s13-assignment-date"
        >
          ${dataConclusao}
        </div>

      </div>

    </td>

  `;

}


// ========================================
// ESCAPAR HTML
// ========================================

function escaparHTML(
  valor
) {

  return String(
    valor ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


// ========================================
// RENDERIZAÇÃO
// ========================================

function renderizarRelatorio() {

  if (
    !s13Body ||
    !serviceYear
  ) {

    return;

  }


  const anoServico =
    serviceYear.value;


  s13Body.innerHTML =
    "";


  if (
    territoriosS13.length === 0
  ) {

    s13Body.innerHTML = `

      <tr>

        <td
          colspan="10"
          class="s13-message"
        >
          Nenhum território cadastrado.
        </td>

      </tr>

    `;

    return;

  }


  const lista =
    territoriosS13
      .slice()
      .sort(
        (a, b) =>
          Number(a.numero)
          -
          Number(b.numero)
      );


  lista.forEach(
    territorio => {

      const movimentacoes =
        obterMovimentacoes(
          territorio,
          anoServico
        );


     const ultimaConclusao =
  obterUltimaConclusao(
    territorio,
    anoServico
  );


      // O formulário possui quatro
      // espaços de designação por linha.
      // Mantemos os quatro primeiros
      // registros do ano selecionado.

      const blocos =
        movimentacoes.slice(
          0,
          4
        );


      while (
        blocos.length < 4
      ) {

        blocos.push(
          null
        );

      }


      const linha =
        document.createElement(
          "tr"
        );


      linha.innerHTML = `

        <td class="s13-numero">
          ${
            escaparHTML(
              territorio.numero
            )
          }
        </td>


        <td class="s13-ultima">

          ${
          ultimaConclusao
  ?
  formatarDataS13(
    ultimaConclusao
  )
  :
  ""
          }

        </td>


        ${
          criarCelulaMovimentacao(
            blocos[0],
            0
          )
        }


        ${
          criarCelulaMovimentacao(
            blocos[1],
            1
          )
        }


        ${
          criarCelulaMovimentacao(
            blocos[2],
            2
          )
        }


        ${
          criarCelulaMovimentacao(
            blocos[3],
            3
          )
        }

      `;


      s13Body.appendChild(
        linha
      );

    }
  );

}


// ========================================
// ERRO
// ========================================

function mostrarErro() {

  if (!s13Body) {
    return;
  }


  s13Body.innerHTML = `

    <tr>

      <td
        colspan="10"
        class="s13-message"
      >
        Não foi possível carregar o relatório.
      </td>

    </tr>

  `;

}


// ========================================
// EVENTOS
// ========================================

if (serviceYear) {

  serviceYear.addEventListener(
    "change",
    renderizarRelatorio
  );

}


if (printButton) {

  printButton.addEventListener(
    "click",
    () => {

      window.print();

    }
  );

}


// ========================================
// INICIALIZAÇÃO
// ========================================

carregarRelatorio();