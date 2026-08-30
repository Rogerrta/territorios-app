const params =
  new URLSearchParams(
    window.location.search
  );

const territoryId =
  Number(
    params.get("id")
  );


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


let territoriosCarregados = [];

let territorioAtual = null;


// ===============================
// CARREGAMENTO
// ===============================

async function carregarTerritorio() {

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


    // Dados oficiais do projeto
    const territoriosBase =
      await resposta.json();


    // Começa utilizando os dados do JSON
    territoriosCarregados =
      territoriosBase;


    const dadosLocais =
      localStorage.getItem(
        "territorios"
      );


    if (dadosLocais) {

      try {

        const territoriosLocais =
          JSON.parse(
            dadosLocais
          );


        /*
         * Mescla os dados locais com os dados
         * oficiais do JSON.
         *
         * Status, responsável, datas e histórico
         * podem vir do LocalStorage.
         *
         * Número, localidade e mapa sempre vêm
         * do JSON atual.
         */

        territoriosCarregados =
          territoriosBase.map(
            territorioBase => {

              const territorioLocal =
                territoriosLocais.find(
                  item =>
                    Number(item.id) ===
                    Number(territorioBase.id)
                );


              if (!territorioLocal) {

                return territorioBase;

              }


              return {

                ...territorioBase,
                ...territorioLocal,

                id:
                  territorioBase.id,

                numero:
                  territorioBase.numero,

                localidade:
                  territorioBase.localidade,

                mapa:
                  territorioBase.mapa

              };

            }
          );


      } catch (erro) {

        console.warn(
          "Não foi possível ler os dados locais.",
          erro
        );

      }

    }


    territorioAtual =
      territoriosCarregados.find(
        item =>
          Number(item.id) ===
          Number(territoryId)
      );


    if (!territorioAtual) {

      mostrarErro(
        "Território não encontrado."
      );

      return;

    }


    renderizarTerritorio(
      territorioAtual
    );


  } catch (erro) {

    console.error(
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

  document.title =
    `Território ${territorio.numero} | Controle de Territórios`;


  if (territoryTitle) {

    territoryTitle.textContent =
      `Território ${territorio.numero}`;

  }


  if (territoryLocation) {

    territoryLocation.textContent =
      territorio.localidade || "";

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


  renderizarHistorico(
    territorio
  );

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
    !currentStatus ||
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

function renderizarHistorico(
  territorio
) {

  if (!historyContent) {
    return;
  }


  if (
    !territorio.historico
    ||
    territorio.historico.length === 0
  ) {

    historyContent.innerHTML = `

      <p>
        Ainda não há movimentações registradas neste território.
      </p>

    `;

    return;

  }


  historyContent.innerHTML = "";


  territorio.historico
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
                    movimentacao.dataDesignacao
                  )
                }
              </strong>

            </span>


            <span>

              Conclusão:
              <strong>
                ${
                  formatarData(
                    movimentacao.dataConclusao
                  )
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
    dataDesignacao.split("-");


  if (
    partes.length !== 3
  ) {

    return "-";

  }


  const [
    ano,
    mes,
    dia
  ] =
    partes.map(Number);


  const inicio =
    new Date(
      ano,
      mes - 1,
      dia
    );


  const hoje =
    new Date();


  const inicioDia =
    new Date(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate()
    );


  const hojeDia =
    new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate()
    );


  const diferenca =
    hojeDia.getTime()
    -
    inicioDia.getTime();


  const dias =
    Math.floor(
      diferenca /
      86400000
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
// LOCAL STORAGE
// ===============================

function salvarDadosLocais() {

  localStorage.setItem(
    "territorios",
    JSON.stringify(
      territoriosCarregados
    )
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
// CONCLUSÃO
// ===============================

function concluirTerritorio() {

  if (!territorioAtual) {
    return;
  }


  if (
    territorioAtual.status !==
      "uso"
    &&
    territorioAtual.status !==
      "atencao"
  ) {

    alert(
      "Este território não está em uso."
    );

    return;

  }


  const confirmar =
    confirm(
      `Concluir o território ${territorioAtual.numero}?`
    );


  if (!confirmar) {
    return;
  }


  const movimentacao = {

    responsavel:
      territorioAtual.responsavel
      ||
      "-",

    dataDesignacao:
      territorioAtual.dataDesignacao
      ||
      null,

    dataConclusao:
      obterDataHoje()

  };


  if (
    !Array.isArray(
      territorioAtual.historico
    )
  ) {

    territorioAtual.historico =
      [];

  }


  territorioAtual.historico.push(
    movimentacao
  );


  territorioAtual.ultimaConclusao =
    movimentacao.dataConclusao;


  territorioAtual.status =
    "disponivel";


  territorioAtual.responsavel =
    null;


  territorioAtual.dataDesignacao =
    null;


  salvarDadosLocais();


  renderizarTerritorio(
    territorioAtual
  );

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
// EVENTOS DO MODAL
// ===============================

const mapModalClose =
  document.getElementById(
    "mapModalClose"
  );


if (mapModalClose) {

  mapModalClose.addEventListener(
    "click",
    fecharMapa
  );

}


const mapModal =
  document.getElementById(
    "mapModal"
  );


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


document.addEventListener(
  "keydown",
  evento => {

    if (
      evento.key ===
      "Escape"
    ) {

      fecharMapa();

    }

  }
);

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


if (designationForm) {

  designationForm.addEventListener(
    "submit",
    evento => {

      evento.preventDefault();


      if (!territorioAtual) {
        return;
      }


      const responsavel =
        document
          .getElementById(
            "designationResponsible"
          )
          .value
          .trim();


      const dataDesignacao =
        document
          .getElementById(
            "designationDate"
          )
          .value;


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


      territorioAtual.status =
        "uso";


      territorioAtual.responsavel =
        responsavel;


      territorioAtual.dataDesignacao =
        dataDesignacao;


      salvarDadosLocais();


      fecharModalDesignacao();


      renderizarTerritorio(
        territorioAtual
      );

    }
  );

}
// ===============================
// INICIALIZAÇÃO
// ===============================

carregarTerritorio();