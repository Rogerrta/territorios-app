// ========================================
// RELATÓRIO S-13
// Registro de Designação de Território
// ========================================

let territoriosS13 = [];

let designacoesS13 = [];


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

// ========================================
// CARREGAMENTO
// ========================================

async function carregarRelatorio() {

  try {

    // ------------------------------------
    // 1. CARREGA OS TERRITÓRIOS
    // DIRETAMENTE DO SUPABASE
    // ------------------------------------

    const {
      data: territoriosBanco,
      error: erroTerritorios
    } =
      await supabaseClient
        .from(
          "territorios"
        )
        .select(
          `
            id,
            numero,
            nome,
            descricao,
            status,
            ultima_conclusao
          `
        )
        .order(
          "numero",
          {
            ascending: true
          }
        );


    if (erroTerritorios) {

      throw erroTerritorios;

    }


    // ------------------------------------
    // 2. CARREGA TODAS AS DESIGNAÇÕES
    // ------------------------------------

    const {
      data: designacoesBanco,
      error: erroDesignacoes
    } =
      await supabaseClient
        .from(
          "Designacoes"
        )
        .select(
          `
            id,
            territorio_id,
            responsavel,
            data_retirada,
            data_devolucao,
            observacoes
          `
        )
        .order(
          "data_retirada",
          {
            ascending: true
          }
        )
        .order(
          "id",
          {
            ascending: true
          }
        );


    if (erroDesignacoes) {

      throw erroDesignacoes;

    }


    // ------------------------------------
    // 3. PREPARA OS TERRITÓRIOS
    // ------------------------------------

    territoriosS13 =
      (
        territoriosBanco
        ||
        []
      ).map(
        territorio => {

          return {

            id:
              territorio.id,

            supabaseId:
              territorio.id,

            numero:
              String(
                territorio.numero
              ).padStart(
                2,
                "0"
              ),

            nome:
              territorio.nome
              ||
              "",

            localidade:
              territorio.descricao
              ||
              "",

            status:
              territorio.status
              ||
              "disponivel",

            ultimaConclusaoBanco:
              territorio.ultima_conclusao
              ||
              null

          };

        }
      );


    // ------------------------------------
    // 4. PREPARA AS DESIGNAÇÕES
    // ------------------------------------

    designacoesS13 =
      designacoesBanco
      ||
      [];


    // ------------------------------------
    // 5. MONTA O RELATÓRIO
    // ------------------------------------

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


  const anoSalvo =
    localStorage.getItem(
      "anoServicoSelecionado"
    );


  const [
    inicioAtual
  ] =
    atual
      .split("/")
      .map(Number);


  serviceYear.innerHTML =
    "";


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


    serviceYear.appendChild(
      option
    );

  }


  const anoSelecionado =
    anoSalvo || atual;


  const existeOpcao =
    Array.from(
      serviceYear.options
    ).some(
      option =>
        option.value ===
        anoSelecionado
    );


  serviceYear.value =
    existeOpcao
      ? anoSelecionado
      : atual;

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

  if (
    !territorio
    ||
    !territorio.supabaseId
  ) {

    return [];

  }


  const movimentacoes =
    designacoesS13
      .filter(
        item =>
          Number(
            item.territorio_id
          ) ===
          Number(
            territorio.supabaseId
          )
      )
      .filter(
        item =>
          dataPertenceAoAno(
            item.data_retirada,
            anoServico
          )
      )
      .map(
        item => {

          return {

            id:
              item.id,

            responsavel:
              item.responsavel
              ||
              "",

            dataDesignacao:
              item.data_retirada,

            dataConclusao:
              item.data_devolucao
              ||
              null,

            ativa:
              item.data_devolucao ===
              null

          };

        }
      );


  movimentacoes.sort(
    (a, b) => {

      const comparacaoData =
        a.dataDesignacao
          .localeCompare(
            b.dataDesignacao
          );


      if (
        comparacaoData !== 0
      ) {

        return comparacaoData;

      }


      return (
        Number(a.id)
        -
        Number(b.id)
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

  if (
    !territorio
    ||
    !territorio.supabaseId
  ) {

    return null;

  }


  const periodo =
    obterPeriodoAnoServico(
      anoServico
    );


  if (!periodo) {
    return null;
  }


  const conclusoes =
    designacoesS13
      .filter(
        item =>
          Number(
            item.territorio_id
          ) ===
          Number(
            territorio.supabaseId
          )
      )
      .filter(
        item =>
          item.data_devolucao
      )
      .filter(
        item =>
          item.data_devolucao <=
          periodo.fim
      )
      .map(
        item =>
          item.data_devolucao
      );


  if (
    territorio.ultimaConclusaoBanco
    &&
    territorio.ultimaConclusaoBanco <=
    periodo.fim
  ) {

    conclusoes.push(
      territorio.ultimaConclusaoBanco
    );

  }


  if (
    conclusoes.length === 0
  ) {

    return null;

  }


  conclusoes.sort();


  return conclusoes[
    conclusoes.length - 1
  ];

}
// ========================================
// CÉLULA DE MOVIMENTAÇÃO
// ========================================

function criarCelulaMovimentacao(
  movimentacao
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
    movimentacao.dataConclusao
      ? formatarDataS13(
          movimentacao.dataConclusao
        )
      : "";


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
    !s13Body
    ||
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


      // O formulário possui quatro espaços
      // de designação por território.

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
              ? formatarDataS13(
                  ultimaConclusao
                )
              : ""
          }

        </td>


        ${
          criarCelulaMovimentacao(
            blocos[0]
          )
        }


        ${
          criarCelulaMovimentacao(
            blocos[1]
          )
        }


        ${
          criarCelulaMovimentacao(
            blocos[2]
          )
        }


        ${
          criarCelulaMovimentacao(
            blocos[3]
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
    () => {

      localStorage.setItem(
        "anoServicoSelecionado",
        serviceYear.value
      );


      renderizarRelatorio();

    }
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