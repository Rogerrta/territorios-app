// ===============================
// PARÂMETROS DA URL
// ===============================

const params =
  new URLSearchParams(
    window.location.search
  );

const territoryId =
  Number(
    params.get("id")
  );


// ===============================
// ELEMENTOS DA PÁGINA
// ===============================

const territoryTitle =
  document.getElementById(
    "territoryTitle"
  );

const territoryLocation =
  document.getElementById(
    "territoryLocation"
  );

const territoryStatus =
  document.getElementById(
    "territoryStatus"
  );

const mapWrapper =
  document.getElementById(
    "mapWrapper"
  );

const currentStatus =
  document.getElementById(
    "currentStatus"
  );

const territoryActions =
  document.getElementById(
    "territoryActions"
  );

const historyContent =
  document.getElementById(
    "historyContent"
  );


// ===============================
// ESTADO
// ===============================

let territorioAtual = null;

let designacoesTerritorio = [];

let designacaoAtiva = null;


// ===============================
// NORMALIZAÇÃO DE STATUS
// ===============================

function normalizarStatus(
  status
) {

  if (!status) {
    return "disponivel";
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
// CARREGAR TERRITÓRIO
// ===============================

async function carregarTerritorio() {

  try {

    if (
      !territoryId
      ||
      Number.isNaN(
        territoryId
      )
    ) {

      mostrarErro(
        "Território não informado."
      );

      return;

    }


    // ===============================
    // 1. CARREGAR JSON
    // ===============================

    const respostaJson =
      await fetch(
        "data/territorios.json"
      );


    if (!respostaJson.ok) {

      throw new Error(
        "Não foi possível carregar o arquivo de territórios."
      );

    }


    const territoriosJson =
      await respostaJson.json();


    const territorioBase =
      territoriosJson.find(
        item =>
          Number(item.id) ===
          territoryId
      );


    if (!territorioBase) {

      mostrarErro(
        "Território não encontrado."
      );

      return;

    }


    // ===============================
    // 2. CARREGAR TERRITÓRIO NO SUPABASE
    // ===============================

    const {
      data: territoriosSupabase,
      error: erroTerritorio
    } =
      await supabaseClient
        .from(
          "territorios"
        )
        .select(
          "*"
        )
        .eq(
          "numero",
          Number(
            territorioBase.numero
          )
        )
        .limit(1);


    if (erroTerritorio) {

      throw erroTerritorio;

    }


    const registroSupabase =
      territoriosSupabase &&
      territoriosSupabase.length
        ? territoriosSupabase[0]
        : null;


    // ===============================
    // 3. CARREGAR DESIGNAÇÕES
    // ===============================

    if (registroSupabase) {

      const {
        data,
        error
      } =
        await supabaseClient
          .from(
            "Designacoes"
          )
          .select(
            "*"
          )
          .eq(
            "territorio_id",
            registroSupabase.id
          )
          .order(
            "data_retirada",
            {
              ascending: false
            }
          )
          .order(
            "id",
            {
              ascending: false
            }
          );


      if (error) {

        throw error;

      }


      designacoesTerritorio =
        data || [];


      designacaoAtiva =
        designacoesTerritorio.find(
          item =>
            item.data_devolucao ===
            null
        )
        ||
        null;

    } else {

      designacoesTerritorio = [];

      designacaoAtiva = null;

    }


    // ===============================
    // 4. MONTAR OBJETO FINAL
    // ===============================

    territorioAtual = {

      ...territorioBase,

      supabaseId:
        registroSupabase
          ? registroSupabase.id
          : null,

      status:
        registroSupabase
          ? normalizarStatus(
              registroSupabase.status
            )
          : normalizarStatus(
              territorioBase.status
            ),

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
          : null

    };


    // ===============================
    // 5. RENDERIZAR
    // ===============================

    renderizarTerritorio(
      territorioAtual
    );


  } catch (erro) {

    console.error(
      "Erro ao carregar território:",
      erro
    );


    mostrarErro(
      "Não foi possível carregar o território."
    );

  }

}


// ===============================
// RENDERIZAÇÃO PRINCIPAL
// ===============================

function renderizarTerritorio(
  territorio
) {

  if (!territorio) {
    return;
  }


  if (territoryTitle) {

    territoryTitle.textContent =
      `Território ${String(
        territorio.numero
      ).padStart(
        2,
        "0"
      )}`;

  }


  if (territoryLocation) {

    territoryLocation.textContent =
      territorio.localidade
      ||
      "";

  }


  renderizarStatus(
    territorio
  );


  renderizarMapa(
    territorio
  );


  renderizarSituacao(
    territorio
  );


  renderizarHistorico();

}
// ===============================
// STATUS
// ===============================

function renderizarStatus(
  territorio
) {

  if (!territoryStatus) {
    return;
  }


  territoryStatus.className =
    "status";


  if (
    territorio.status ===
    "disponivel"
  ) {

    territoryStatus.textContent =
      "Disponível";


    territoryStatus.classList.add(
      "available"
    );

    return;

  }


  if (
    territorio.status ===
    "uso"
  ) {

    territoryStatus.textContent =
      "Em uso";


    territoryStatus.classList.add(
      "in-use"
    );

    return;

  }


  if (
    territorio.status ===
    "atencao"
  ) {

    territoryStatus.textContent =
      "Atenção";


    territoryStatus.classList.add(
      "attention"
    );

    return;

  }


  territoryStatus.textContent =
    territorio.status || "-";

}


// ===============================
// MAPA
// ===============================

function renderizarMapa(
  territorio
) {

  if (!mapWrapper) {
    return;
  }


  if (!territorio.mapa) {

    mapWrapper.innerHTML = `
      <p>
        Mapa ainda não cadastrado.
      </p>
    `;

    return;

  }


  mapWrapper.innerHTML = `

    <button
      type="button"
      class="map-button"
      onclick="abrirMapa()"
      aria-label="Ampliar mapa do território"
    >

      <img
        src="${territorio.mapa}"
        alt="Mapa do território ${territorio.numero}"
        class="territory-map"
      >

    </button>

  `;

}


// ===============================
// SITUAÇÃO ATUAL
// ===============================

function renderizarSituacao(
  territorio
) {

  if (
    !currentStatus
    ||
    !territoryActions
  ) {

    return;

  }


  if (
    territorio.status ===
    "disponivel"
  ) {

    currentStatus.innerHTML = `

      <div class="status-empty">

        <p>
          Este território está disponível para designação.
        </p>

      </div>

    `;


    territoryActions.innerHTML = `

      <button
        type="button"
        class="btn-primary"
        onclick="designarTerritorio()"
      >
        Designar território
      </button>

    `;

    return;

  }


  if (
    territorio.status ===
      "uso"
    ||
    territorio.status ===
      "atencao"
  ) {

    currentStatus.innerHTML = `

      <div class="current-info">

        <div class="current-info-item">

          <span>
            Designado para
          </span>

          <strong>
            ${
              territorio.responsavel
              ||
              "-"
            }
          </strong>

        </div>


        <div class="current-info-item">

          <span>
            Data da designação
          </span>

          <strong>
            ${
              formatarData(
                territorio.dataDesignacao
              )
            }
          </strong>

        </div>


        <div class="current-info-item">

          <span>
            Tempo em uso
          </span>

          <strong>
            ${
              calcularDias(
                territorio.dataDesignacao
              )
            }
          </strong>

        </div>

      </div>

    `;


    territoryActions.innerHTML = `

      <button
        type="button"
        class="btn-secondary"
        onclick="enviarWhatsApp()"
      >
        Enviar pelo WhatsApp
      </button>

      <button
        type="button"
        class="btn-primary"
        onclick="concluirTerritorio()"
      >
        Concluir território
      </button>

    `;

    return;

  }


  currentStatus.innerHTML = `
    <p>
      Situação não identificada.
    </p>
  `;


  territoryActions.innerHTML = "";

}


// ===============================
// HISTÓRICO
// ===============================

function renderizarHistorico() {

  if (!historyContent) {
    return;
  }


  if (
    !designacoesTerritorio
    ||
    designacoesTerritorio.length === 0
  ) {

    historyContent.innerHTML = `

      <p>
        Ainda não há movimentações registradas neste território.
      </p>

    `;

    return;

  }


  historyContent.innerHTML = "";


  designacoesTerritorio
    .slice()
    .reverse()
    .forEach(
      movimentacao => {

        const item =
          document.createElement(
            "article"
          );


        item.classList.add(
          "history-item"
        );


        item.innerHTML = `

          <div class="history-item-header">

            <strong>
              ${
                movimentacao.responsavel
                ||
                "-"
              }
            </strong>

          </div>


          <div class="history-item-info">

            <span>

              Designação:
              <strong>
                ${
                  formatarData(
                    movimentacao.data_retirada
                  )
                }
              </strong>

            </span>


            <span>

              Conclusão:
              <strong>
                ${
                  movimentacao.data_devolucao
                    ? formatarData(
                        movimentacao.data_devolucao
                      )
                    : "Em andamento"
                }
              </strong>

            </span>

          </div>

        `;


        historyContent.appendChild(
          item
        );

      }
    );

}


// ===============================
// DATAS
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


function calcularDias(
  dataDesignacao
) {

  if (!dataDesignacao) {
    return "-";
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

    return "-";

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
    Math.max(
      0,
      Math.floor(
        diferenca /
        86400000
      )
    );


  if (dias === 1) {

    return "1 dia";

  }


  return `${dias} dias`;

}


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
// DESIGNAÇÃO
// ===============================

function designarTerritorio() {

  if (!territorioAtual) {
    return;
  }


  const modal =
    document.getElementById(
      "designationModal"
    );


  const campoResponsavel =
    document.getElementById(
      "designationResponsible"
    );


  const campoData =
    document.getElementById(
      "designationDate"
    );


  if (
    !modal
    ||
    !campoResponsavel
    ||
    !campoData
  ) {

    return;

  }


  campoResponsavel.value =
    "";


  campoData.value =
    obterDataHoje();


  modal.classList.add(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );


  campoResponsavel.focus();

}


// ===============================
// WHATSAPP
// ===============================

function enviarWhatsApp() {

  if (!territorioAtual) {
    return;
  }


  if (
    territorioAtual.status !== "uso"
    &&
    territorioAtual.status !== "atencao"
  ) {

    alert(
      "Este território ainda não está designado."
    );

    return;

  }


  const numero =
    territorioAtual.numero || "-";


  const responsavel =
    territorioAtual.responsavel || "-";


  const data =
    formatarData(
      territorioAtual.dataDesignacao
    );


  const localidade =
    territorioAtual.localidade
      ? `\nLocalidade: ${territorioAtual.localidade}`
      : "";


  let mapa = "";


  if (territorioAtual.mapa) {

    const caminhoMapa =
      String(
        territorioAtual.mapa
      ).replace(
        /^\/+/,
        ""
      );


    const urlMapa =
      `https://rogerrta.github.io/territorios-app/${caminhoMapa}`;


    mapa =
      `\n\nVer mapa do território:\n${urlMapa}`;

  }


  const mensagem =
    `Olá!

Foi designado para você o Território ${numero}.

Responsável: ${responsavel}
Data da designação: ${data}${localidade}${mapa}

Bom trabalho!`;


  const url =
    `https://wa.me/?text=${
      encodeURIComponent(
        mensagem
      )
    }`;


  window.open(
    url,
    "_blank"
  );

}


// ===============================
// CONCLUSÃO
// ===============================

// ===============================
// ABRIR MODAL DE CONCLUSÃO
// ===============================

function concluirTerritorio() {

  if (!territorioAtual) {
    return;
  }


  if (
    territorioAtual.status !== "uso"
    &&
    territorioAtual.status !== "atencao"
  ) {

    alert(
      "Este território não está em uso."
    );

    return;
  }


  if (!designacaoAtiva) {

    alert(
      "Não foi encontrada uma designação ativa para este território."
    );

    return;
  }


  const modal =
    document.getElementById(
      "conclusionModal"
    );


  const campoData =
    document.getElementById(
      "conclusionDate"
    );


  const titulo =
    document.getElementById(
      "conclusionModalTitle"
    );


  if (
    !modal
    ||
    !campoData
  ) {

    return;
  }


  const hoje =
    obterDataHoje();


  campoData.value =
    hoje;


  campoData.max =
    hoje;


  if (
    designacaoAtiva.data_retirada
  ) {

    campoData.min =
      designacaoAtiva.data_retirada;

  } else {

    campoData.removeAttribute(
      "min"
    );

  }


  if (titulo) {

    titulo.textContent =
      `Concluir território ${territorioAtual.numero}`;

  }


  modal.classList.add(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );


  campoData.focus();

}
// ===============================
// MODAL DO MAPA
// ===============================

function abrirMapa() {

  if (
    !territorioAtual
    ||
    !territorioAtual.mapa
  ) {

    return;

  }


  const mapModal =
    document.getElementById(
      "mapModal"
    );


  const mapModalImage =
    document.getElementById(
      "mapModalImage"
    );


  if (
    !mapModal
    ||
    !mapModalImage
  ) {

    return;

  }


  mapModalImage.src =
    territorioAtual.mapa;


  mapModalImage.alt =
    `Mapa ampliado do território ${territorioAtual.numero}`;


  mapModal.classList.add(
    "active"
  );


  document.body.classList.add(
    "modal-open"
  );

}


function fecharMapa() {

  const mapModal =
    document.getElementById(
      "mapModal"
    );


  if (!mapModal) {
    return;
  }


  mapModal.classList.remove(
    "active"
  );


  document.body.classList.remove(
    "modal-open"
  );

}


// ===============================
// ERROS
// ===============================

function mostrarErro(
  mensagem
) {

  if (territoryTitle) {

    territoryTitle.textContent =
      "Erro";

  }


  if (territoryLocation) {

    territoryLocation.textContent =
      mensagem;

  }


  if (territoryStatus) {

    territoryStatus.textContent =
      "";

  }


  if (mapWrapper) {

    mapWrapper.innerHTML =
      "";

  }


  if (currentStatus) {

    currentStatus.innerHTML =
      "";

  }


  if (territoryActions) {

    territoryActions.innerHTML =
      "";

  }


  if (historyContent) {

    historyContent.innerHTML =
      "";

  }

}
// ===============================
// MODAL DE DESIGNAÇÃO
// ===============================

function fecharModalDesignacao() {

  const modal =
    document.getElementById(
      "designationModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "modal-open"
  );

}

// ===============================
// MODAL DE CONCLUSÃO
// ===============================

function fecharModalConclusao() {

  const modal =
    document.getElementById(
      "conclusionModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "modal-open"
  );

}

// ===============================
// ELEMENTOS DO MODAL
// ===============================

const designationForm =
  document.getElementById(
    "designationForm"
  );


const designationModalClose =
  document.getElementById(
    "designationModalClose"
  );


const designationCancel =
  document.getElementById(
    "designationCancel"
  );

const conclusionForm =
  document.getElementById(
    "conclusionForm"
  );


const conclusionModalClose =
  document.getElementById(
    "conclusionModalClose"
  );


const conclusionCancel =
  document.getElementById(
    "conclusionCancel"
  );

const mapModalClose =
  document.getElementById(
    "mapModalClose"
  );


const mapModal =
  document.getElementById(
    "mapModal"
  );


// ===============================
// EVENTOS DO MAPA
// ===============================

if (mapModalClose) {

  mapModalClose.addEventListener(
    "click",
    fecharMapa
  );

}


if (mapModal) {

  mapModal.addEventListener(
    "click",
    evento => {

      if (
        evento.target ===
        mapModal
      ) {

        fecharMapa();

      }

    }
  );

}


// ===============================
// EVENTOS DO MODAL DE DESIGNAÇÃO
// ===============================

if (designationModalClose) {

  designationModalClose.addEventListener(
    "click",
    fecharModalDesignacao
  );

}


if (designationCancel) {

  designationCancel.addEventListener(
    "click",
    fecharModalDesignacao
  );

}


// ===============================
// CONFIRMAR DESIGNAÇÃO
// ===============================

if (designationForm) {

  designationForm.addEventListener(
    "submit",
    async evento => {

      evento.preventDefault();


      if (!territorioAtual) {
        return;
      }


      if (!territorioAtual.supabaseId) {

        alert(
          "Este território ainda não está cadastrado no Supabase."
        );

        return;

      }


      const campoResponsavel =
        document.getElementById(
          "designationResponsible"
        );


      const campoData =
        document.getElementById(
          "designationDate"
        );


      if (
        !campoResponsavel
        ||
        !campoData
      ) {

        return;

      }


      const responsavel =
        campoResponsavel.value
          .trim();


      const dataDesignacao =
        campoData.value;


      if (
        !responsavel
        ||
        !dataDesignacao
      ) {

        alert(
          "Preencha o responsável e a data da designação."
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
                    territorioAtual.supabaseId,

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


        fecharModalDesignacao();


        alert(
          `Território ${territorioAtual.numero} designado para ${responsavel}.`
        );


        console.log(
          "Designação criada:",
          data
        );


        await carregarTerritorio();


      } catch (erro) {

        console.error(
          "Erro ao designar território:",
          erro
        );


        if (
          erro &&
          erro.code ===
            "23505"
        ) {

          alert(
            "Este território já possui uma designação ativa."
          );

          return;

        }


        alert(
          "Não foi possível registrar a designação no Supabase."
        );

      }

    }
  );

}

// ===============================
// EVENTOS DO MODAL DE CONCLUSÃO
// ===============================

if (conclusionModalClose) {

  conclusionModalClose.addEventListener(
    "click",
    fecharModalConclusao
  );

}


if (conclusionCancel) {

  conclusionCancel.addEventListener(
    "click",
    fecharModalConclusao
  );

}


// ===============================
// CONFIRMAR CONCLUSÃO
// ===============================

if (conclusionForm) {

  conclusionForm.addEventListener(
    "submit",
    async evento => {

      evento.preventDefault();


      if (
        !territorioAtual
        ||
        !designacaoAtiva
      ) {

        return;

      }


      const campoData =
        document.getElementById(
          "conclusionDate"
        );


      if (!campoData) {
        return;
      }


      const dataConclusao =
        campoData.value;


      const dataDesignacao =
        designacaoAtiva.data_retirada;


      const hoje =
        obterDataHoje();


      if (!dataConclusao) {

        alert(
          "Informe a data da devolução."
        );

        return;
      }


      if (
        dataDesignacao
        &&
        dataConclusao <
          dataDesignacao
      ) {

        alert(
          "A data da devolução não pode ser anterior à data da designação."
        );

        return;
      }


      if (
        dataConclusao >
        hoje
      ) {

        alert(
          "A data da devolução não pode ser uma data futura."
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
            .update({
              data_devolucao:
                dataConclusao
            })
            .eq(
              "id",
              designacaoAtiva.id
            )
            .is(
              "data_devolucao",
              null
            )
            .select(
              "id, territorio_id, data_devolucao"
            );


        if (error) {

          throw error;

        }


        if (
          !data
          ||
          data.length === 0
        ) {

          throw new Error(
            "Nenhuma designação foi atualizada."
          );

        }


        fecharModalConclusao();


        alert(
          `Território ${territorioAtual.numero} concluído com sucesso.`
        );


        await carregarTerritorio();


      } catch (erro) {

        console.error(
          "Erro ao concluir território:",
          erro
        );


        alert(
          "Não foi possível concluir o território no Supabase."
        );

      }

    }
  );

}

// ===============================
// TECLA ESC
// ===============================

document.addEventListener(
  "keydown",
  evento => {

    if (
      evento.key ===
      "Escape"
    ) {

      fecharMapa();

      fecharModalDesignacao();

      fecharModalConclusao();

    }

  }
);


// ===============================
// INICIALIZAÇÃO
// ===============================

carregarTerritorio();