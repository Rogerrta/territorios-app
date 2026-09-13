let territorios = [];


// ===============================
// CONFIGURAÇÕES
// ===============================

const LIMITE_ATENCAO_DIAS = 30;


// ===============================
// ELEMENTOS DA PÁGINA
// ===============================

const grid =
  document.getElementById(
    "territoriesGrid"
  );

const searchInput =
  document.getElementById(
    "search"
  );

const statusFilter =
  document.getElementById(
    "statusFilter"
  );

const totalTerritorios =
  document.getElementById(
    "totalTerritorios"
  );

const totalDisponiveis =
  document.getElementById(
    "totalDisponiveis"
  );

const totalEmUso =
  document.getElementById(
    "totalEmUso"
  );

const totalAtencao =
  document.getElementById(
    "totalAtencao"
  );


// ===============================
// ELEMENTOS DO MODAL
// ===============================

const newMovementBtn =
  document.getElementById(
    "newMovementBtn"
  );

const newMovementModal =
  document.getElementById(
    "newMovementModal"
  );

const newMovementClose =
  document.getElementById(
    "newMovementClose"
  );

const newMovementCancel =
  document.getElementById(
    "newMovementCancel"
  );

const newMovementOverlay =
  document.getElementById(
    "newMovementOverlay"
  );

const newMovementForm =
  document.getElementById(
    "newMovementForm"
  );

const movementTerritory =
  document.getElementById(
    "movementTerritory"
  );

const movementResponsible =
  document.getElementById(
    "movementResponsible"
  );

const movementDate =
  document.getElementById(
    "movementDate"
  );


// ===============================
// NORMALIZAÇÃO DE STATUS
// ===============================

function normalizarStatusSupabase(
  status
) {

  if (!status) {
    return null;
  }


  const valor =
    String(status)
      .trim()
      .toLowerCase();


  if (
    valor === "disponivel"
    ||
    valor === "disponível"
  ) {

    return "disponivel";

  }


  if (
    valor === "em uso"
    ||
    valor === "uso"
  ) {

    return "uso";

  }


  if (
    valor === "atencao"
    ||
    valor === "atenção"
  ) {

    return "atencao";

  }


  return valor;

}


// ===============================
// CARREGAR DADOS DO SUPABASE
// ===============================

async function carregarTerritoriosSupabase() {

  if (
    typeof supabaseClient ===
    "undefined"
  ) {

    console.warn(
      "Supabase não está disponível."
    );

    return {
      territorios: [],
      designacoes: []
    };

  }


  const [
    respostaTerritorios,
    respostaDesignacoes
  ] =
    await Promise.all([
      supabaseClient
        .from(
          "territorios"
        )
        .select(
          "*"
        ),

      supabaseClient
        .from(
          "Designacoes"
        )
        .select(
          "*"
        )
        .is(
          "data_devolucao",
          null
        )
        .order(
          "data_retirada",
          {
            ascending: false
          }
        )
    ]);


  if (
    respostaTerritorios.error
  ) {

    console.error(
      "Erro ao carregar territórios do Supabase:",
      respostaTerritorios.error
    );

  }


  if (
    respostaDesignacoes.error
  ) {

    console.error(
      "Erro ao carregar designações do Supabase:",
      respostaDesignacoes.error
    );

  }


  return {

    territorios:
      respostaTerritorios.data
      ||
      [],

    designacoes:
      respostaDesignacoes.data
      ||
      []

  };

}

// ===============================
// CARREGAMENTO
// ===============================

async function carregarTerritorios() {

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


    const territoriosBase =
      await resposta.json();


         const dadosSupabase =
         await carregarTerritoriosSupabase();


const territoriosSupabase =
  dadosSupabase.territorios;


const designacoesAtivas =
  dadosSupabase.designacoes;



    territorios =
      territoriosBase.map(
        territorioBase => {

          const registroSupabase =
            territoriosSupabase.find(
              item =>
                Number(item.numero) ===
                Number(territorioBase.numero)
            );
            const designacaoAtiva =
  registroSupabase
    ? designacoesAtivas.find(
        item =>
          Number(item.territorio_id) ===
          Number(registroSupabase.id)
      )
    : null;

          if (!registroSupabase) {

            return territorioBase;

          }


          return {

  ...territorioBase,

  supabaseId:
    registroSupabase.id,

  status:
    normalizarStatusSupabase(
      registroSupabase.status
    )
    ||
    territorioBase.status,

  responsavel:
    designacaoAtiva
      ? designacaoAtiva.responsavel
      : null,

  dataDesignacao:
    designacaoAtiva
      ? designacaoAtiva.data_retirada
      : null,

  designacaoId:
    designacaoAtiva
      ? designacaoAtiva.id
      : null,

  ultimaConclusao:
    registroSupabase.ultima_conclusao
    ||
    territorioBase.ultimaConclusao
    ||
    null

};

        }
      );


    /*
     * Nesta etapa não deixamos mais o
     * LocalStorage sobrescrever o estado
     * vindo do Supabase.
     *
     * O JSON continua sendo a base para
     * número, localidade, mapa e os 32
     * territórios cadastrados.
     */


    atualizarResumo();


    renderizarTerritorios(
      territorios
    );


  } catch (erro) {

    console.error(
      erro
    );


    if (grid) {

      grid.innerHTML = `
        <p>
          Não foi possível carregar os territórios.
        </p>
      `;

    }

  }

}


// ===============================
// SALVAR LOCALMENTE
// ===============================

function salvarTerritorios() {

  /*
   * Mantida temporariamente por compatibilidade
   * com outras partes do projeto.
   *
   * À medida que migrarmos as movimentações
   * para o Supabase, esta função deixará
   * de ser necessária.
   */

  localStorage.setItem(
    "territorios",
    JSON.stringify(
      territorios
    )
  );

}
// ===============================
// FORMATAÇÃO DE DATA
// ===============================

function formatarData(
  data
) {

  if (!data) {
    return "-";
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


// ===============================
// TEMPO EM USO
// ===============================

function calcularDiasNumero(
  dataDesignacao
) {

  if (!dataDesignacao) {
    return 0;
  }


  const partes =
    dataDesignacao
      .split("-")
      .map(Number);


  if (
    partes.length !== 3
    ||
    partes.some(
      parte =>
        Number.isNaN(parte)
    )
  ) {

    return 0;

  }


  const [
    ano,
    mes,
    dia
  ] = partes;


  const inicio =
    Date.UTC(
      ano,
      mes - 1,
      dia
    );


  const hoje =
    new Date();


  const hojeUTC =
    Date.UTC(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate()
    );


  const diferenca =
    hojeUTC - inicio;


  const dias =
    Math.floor(
      diferenca /
      86400000
    );


  return Math.max(
    0,
    dias
  );

}


function calcularDias(
  dataDesignacao
) {

  if (!dataDesignacao) {
    return "-";
  }


  const dias =
    calcularDiasNumero(
      dataDesignacao
    );


  if (dias === 1) {

    return "1 dia";

  }


  return `${dias} dias`;

}


// ===============================
// STATUS AUTOMÁTICO
// ===============================

function obterStatusEfetivo(
  territorio
) {

  if (
    territorio.status ===
    "disponivel"
  ) {

    return "disponivel";

  }


  if (
    territorio.status ===
    "uso"
  ) {

    const diasUso =
      calcularDiasNumero(
        territorio.dataDesignacao
      );


    if (
      territorio.dataDesignacao
      &&
      diasUso >=
        LIMITE_ATENCAO_DIAS
    ) {

      return "atencao";

    }


    return "uso";

  }


  if (
    territorio.status ===
    "atencao"
  ) {

    return "atencao";

  }


  return territorio.status;

}


// ===============================
// RESUMO
// ===============================

function atualizarResumo() {

  const disponiveis =
    territorios.filter(
      territorio =>
        obterStatusEfetivo(
          territorio
        ) ===
        "disponivel"
    ).length;


  const emUso =
    territorios.filter(
      territorio =>
        obterStatusEfetivo(
          territorio
        ) ===
        "uso"
    ).length;


  const atencao =
    territorios.filter(
      territorio =>
        obterStatusEfetivo(
          territorio
        ) ===
        "atencao"
    ).length;


  if (totalTerritorios) {

    totalTerritorios.textContent =
      territorios.length;

  }


  if (totalDisponiveis) {

    totalDisponiveis.textContent =
      disponiveis;

  }


  if (totalEmUso) {

    totalEmUso.textContent =
      emUso;

  }


  if (totalAtencao) {

    totalAtencao.textContent =
      atencao;

  }

}


// ===============================
// CARDS DOS TERRITÓRIOS
// ===============================

function renderizarTerritorios(
  lista
) {

  if (!grid) {
    return;
  }


  grid.innerHTML = "";


  if (
    !lista
    ||
    lista.length === 0
  ) {

    grid.innerHTML = `
      <p>
        Nenhum território encontrado.
      </p>
    `;

    return;

  }


  lista.forEach(
    territorio => {

      const card =
        document.createElement(
          "article"
        );


      card.classList.add(
        "territory-card"
      );


      const statusEfetivo =
        obterStatusEfetivo(
          territorio
        );


      let statusTexto = "";
      let statusClasse = "";
      let detalhes = "";


      if (
        statusEfetivo ===
        "disponivel"
      ) {

        statusTexto =
          "Disponível";


        statusClasse =
          "available";


        detalhes = `

          <p>
            Pronto para designação
          </p>

        `;

      }


      if (
        statusEfetivo ===
        "uso"
      ) {

        statusTexto =
          "Em uso";


        statusClasse =
          "in-use";


        const tempoUso =
          calcularDias(
            territorio.dataDesignacao
          );


        detalhes = `

          <p>

            Designado para:
            <strong>
              ${
                territorio.responsavel
                ||
                "-"
              }
            </strong>

          </p>

          <p>

            Desde:
            <strong>
              ${
                formatarData(
                  territorio.dataDesignacao
                )
              }
            </strong>

          </p>

          <p>

            Tempo em uso:
            <strong>
              ${tempoUso}
            </strong>

          </p>

        `;

      }


      if (
        statusEfetivo ===
        "atencao"
      ) {

        statusTexto =
          "Atenção";


        statusClasse =
          "warning";


        const tempoUso =
          calcularDias(
            territorio.dataDesignacao
          );


        detalhes = `

          <p>

            Designado para:
            <strong>
              ${
                territorio.responsavel
                ||
                "-"
              }
            </strong>

          </p>

          <p>

            Desde:
            <strong>
              ${
                formatarData(
                  territorio.dataDesignacao
                )
              }
            </strong>

          </p>

          <p>

            Tempo em uso:
            <strong>
              ${tempoUso}
            </strong>

          </p>

        `;

      }


      card.innerHTML = `

        <div class="territory-top">

          <span class="territory-number">

            Território
            ${territorio.numero}

          </span>


          <span
            class="status ${statusClasse}"
          >

            ${statusTexto}

          </span>

        </div>


        <h3>
          ${territorio.localidade}
        </h3>


        ${detalhes}


        <button
          type="button"
          class="btn-secondary"
          onclick="abrirTerritorio(${territorio.id})"
        >
          Abrir território
        </button>

      `;


      grid.appendChild(
        card
      );

    }
  );

}
// ===============================
// FILTROS
// ===============================

function aplicarFiltros() {

  const busca =
    searchInput
      ? searchInput.value
          .toLowerCase()
          .trim()
      : "";


  const status =
    statusFilter
      ? statusFilter.value
      : "todos";


  const resultado =
    territorios.filter(
      territorio => {

        const numero =
          String(
            territorio.numero
          ).toLowerCase();


        const localidade =
          String(
            territorio.localidade
            ||
            ""
          ).toLowerCase();


        const correspondeBusca =
          numero.includes(
            busca
          )
          ||
          localidade.includes(
            busca
          );


        const statusEfetivo =
          obterStatusEfetivo(
            territorio
          );


        const correspondeStatus =
          status ===
            "todos"
          ||
          statusEfetivo ===
            status;


        return (
          correspondeBusca
          &&
          correspondeStatus
        );

      }
    );


  renderizarTerritorios(
    resultado
  );

}


// ===============================
// ABRIR TERRITÓRIO
// ===============================

function abrirTerritorio(
  id
) {

  window.location.href =
    `territorio.html?id=${id}`;

}


// ===============================
// DATA DE HOJE
// ===============================

function obterDataHoje() {

  const hoje =
    new Date();


  const ano =
    hoje.getFullYear();


  const mes =
    String(
      hoje.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const dia =
    String(
      hoje.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${ano}-${mes}-${dia}`
  );

}


// ===============================
// NOVA MOVIMENTAÇÃO
// ===============================

function abrirNovaMovimentacao() {

  if (
    !newMovementModal
    ||
    !movementTerritory
  ) {

    return;

  }


  movementTerritory.innerHTML = `
    <option value="">
      Selecione um território
    </option>
  `;


  const disponiveis =
    territorios.filter(
      territorio =>
        obterStatusEfetivo(
          territorio
        ) ===
        "disponivel"
    );


  disponiveis.forEach(
    territorio => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        territorio.id;


      option.textContent =
        `Território ${territorio.numero} — ${territorio.localidade}`;


      movementTerritory.appendChild(
        option
      );

    }
  );


  if (movementResponsible) {

    movementResponsible.value =
      "";

  }


  if (movementDate) {

    movementDate.value =
      obterDataHoje();

  }


  newMovementModal.hidden =
    false;


  newMovementModal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );


  movementTerritory.focus();

}


function fecharNovaMovimentacao() {

  if (!newMovementModal) {

    return;

  }


  newMovementModal.hidden =
    true;


  newMovementModal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "modal-open"
  );

}


// ===============================
// BUSCAR ID DO SUPABASE
// ===============================

function obterSupabaseIdTerritorio(
  territorio
) {

  if (!territorio) {
    return null;
  }


  if (territorio.supabaseId) {

    return territorio.supabaseId;

  }


  return null;

}
// ===============================
// CONFIRMAR NOVA MOVIMENTAÇÃO
// ===============================

async function confirmarNovaMovimentacao(
  evento
) {

  evento.preventDefault();


  const territorioId =
    Number(
      movementTerritory.value
    );


  const responsavel =
    movementResponsible.value
      .trim();


  const dataDesignacao =
    movementDate.value;


  if (
    !territorioId
    ||
    !responsavel
    ||
    !dataDesignacao
  ) {

    alert(
      "Preencha todos os campos."
    );

    return;

  }


  const territorio =
    territorios.find(
      item =>
        Number(item.id) ===
        territorioId
    );


  if (!territorio) {

    alert(
      "Território não encontrado."
    );

    return;

  }


  if (
    obterStatusEfetivo(
      territorio
    ) !==
    "disponivel"
  ) {

    alert(
      "Este território não está disponível."
    );

    return;

  }


  const supabaseId =
    obterSupabaseIdTerritorio(
      territorio
    );


  /*
   * Nesta primeira etapa somente
   * territórios já cadastrados no
   * Supabase podem ser designados.
   */

  if (!supabaseId) {

    alert(
      `O Território ${territorio.numero} ainda não foi cadastrado no Supabase.`
    );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "Designacoes"
        )
        .insert(
          [
            {
              territorio_id:
                supabaseId,

              responsavel:
                responsavel,

              data_retirada:
                dataDesignacao,

              data_devolucao:
                null,

              observacoes:
                null
            }
          ]
        )
        .select();


    if (error) {

      throw error;

    }


    /*
     * O trigger do Supabase altera
     * automaticamente o território
     * para "Em uso".
     *
     * Atualizamos também o objeto local
     * para refletir imediatamente na tela.
     */

    fecharNovaMovimentacao();

await carregarTerritorios();


    alert(
      `Território ${territorio.numero} designado para ${responsavel}.`
    );


    console.log(
      "Designação gravada no Supabase:",
      data
    );


  } catch (erro) {

    console.error(
      "Erro ao registrar designação:",
      erro
    );


    alert(
      "Não foi possível registrar a designação no Supabase."
    );

  }

}


// ===============================
// EVENTOS DOS FILTROS
// ===============================

if (searchInput) {

  searchInput.addEventListener(
    "input",
    aplicarFiltros
  );

}


if (statusFilter) {

  statusFilter.addEventListener(
    "change",
    aplicarFiltros
  );

}


// ===============================
// EVENTOS DO MODAL
// ===============================

if (newMovementBtn) {

  newMovementBtn.addEventListener(
    "click",
    abrirNovaMovimentacao
  );

}


if (newMovementClose) {

  newMovementClose.addEventListener(
    "click",
    fecharNovaMovimentacao
  );

}


if (newMovementCancel) {

  newMovementCancel.addEventListener(
    "click",
    fecharNovaMovimentacao
  );

}


if (newMovementOverlay) {

  newMovementOverlay.addEventListener(
    "click",
    fecharNovaMovimentacao
  );

}


if (newMovementForm) {

  newMovementForm.addEventListener(
    "submit",
    confirmarNovaMovimentacao
  );

}


document.addEventListener(
  "keydown",
  evento => {

    if (
      evento.key === "Escape"
      &&
      newMovementModal
      &&
      !newMovementModal.hidden
    ) {

      fecharNovaMovimentacao();

    }

  }
);


// ===============================
// INICIALIZAÇÃO
// ===============================

carregarTerritorios();
