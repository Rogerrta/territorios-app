const params = new URLSearchParams(window.location.search);

const territoryId = Number(params.get("id"));

const territoryTitle =
  document.getElementById("territoryTitle");

const territoryLocation =
  document.getElementById("territoryLocation");

const territoryStatus =
  document.getElementById("territoryStatus");

const territoryMap =
  document.getElementById("territoryMap");

const mapWrapper =
  document.getElementById("mapWrapper");

const currentStatus =
  document.getElementById("currentStatus");

const territoryActions =
  document.getElementById("territoryActions");

const historyContent =
  document.getElementById("historyContent");


async function carregarTerritorio() {

  try {

    const resposta =
      await fetch("data/territorios.json");

    if (!resposta.ok) {
      throw new Error(
        "Não foi possível carregar os territórios."
      );
    }

    const territorios =
      await resposta.json();

    const territorio =
      territorios.find(
        item => item.id === territoryId
      );


    if (!territorio) {

      mostrarErro(
        "Território não encontrado."
      );

      return;
    }


    renderizarTerritorio(
      territorio
    );

  } catch (erro) {

    console.error(erro);

    mostrarErro(
      "Não foi possível carregar o território."
    );

  }

}


function renderizarTerritorio(territorio) {

  document.title =
    `Território ${territorio.numero} | Controle de Territórios`;


  territoryTitle.textContent =
    `Território ${territorio.numero}`;


  territoryLocation.textContent =
    territorio.localidade;


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


function renderizarStatus(territorio) {

  territoryStatus.className =
    "status";


  if (
    territorio.status === "disponivel"
  ) {

    territoryStatus.textContent =
      "Disponível";

    territoryStatus.classList.add(
      "available"
    );

  }


  if (
    territorio.status === "uso"
  ) {

    territoryStatus.textContent =
      "Em uso";

    territoryStatus.classList.add(
      "in-use"
    );

  }


  if (
    territorio.status === "atencao"
  ) {

    territoryStatus.textContent =
      "Atenção";

    territoryStatus.classList.add(
      "warning"
    );

  }

}


function renderizarMapa(territorio) {

  const mapa =
    territorio.mapa;


  if (!mapa) {

    mapWrapper.innerHTML = `
      <div class="map-placeholder">

        <strong>
          Mapa ainda não cadastrado
        </strong>

        <span>
          Território ${territorio.numero}
        </span>

      </div>
    `;

    return;
  }


  territoryMap.src =
    mapa;


  territoryMap.alt =
    `Mapa do território ${territorio.numero} - ${territorio.localidade}`;


  territoryMap.onerror =
    () => {

      mapWrapper.innerHTML = `
        <div class="map-placeholder">

          <strong>
            Não foi possível carregar o mapa
          </strong>

          <span>
            Território ${territorio.numero}
          </span>

        </div>
      `;

    };


  territoryMap.onclick =
    () => abrirMapa(mapa);

}


function renderizarSituacao(territorio) {

  if (
    territorio.status === "disponivel"
  ) {

    currentStatus.innerHTML = `

      <div class="status-info-row">

        <span>
          Situação
        </span>

        <strong>
          Disponível para designação
        </strong>

      </div>

    `;


    if (
      territorio.ultimaConclusao
    ) {

      currentStatus.innerHTML += `

        <div class="status-info-row">

          <span>
            Última conclusão
          </span>

          <strong>
            ${formatarData(
              territorio.ultimaConclusao
            )}
          </strong>

        </div>

      `;

    }


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
    territorio.status === "uso"
    ||
    territorio.status === "atencao"
  ) {

    currentStatus.innerHTML = `

      <div class="status-info-grid">

        <div class="status-info-box">

          <span>
            Designado para
          </span>

          <strong>
            ${territorio.responsavel || "-"}
          </strong>

        </div>


        <div class="status-info-box">

          <span>
            Data da designação
          </span>

          <strong>
            ${formatarData(
              territorio.dataDesignacao
            )}
          </strong>

        </div>


        <div class="status-info-box">

          <span>
            Tempo em uso
          </span>

          <strong>
            ${calcularDias(
              territorio.dataDesignacao
            )}
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

  }

}


function renderizarHistorico(territorio) {

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
          document.createElement("article");

        item.classList.add(
          "history-item"
        );


        item.innerHTML = `

          <div class="history-item-header">

            <strong>
              ${movimentacao.responsavel || "-"}
            </strong>

          </div>


          <div class="history-item-info">

            <span>
              Designação:
              <strong>
                ${formatarData(
                  movimentacao.dataDesignacao
                )}
              </strong>
            </span>


            <span>
              Conclusão:
              <strong>
                ${formatarData(
                  movimentacao.dataConclusao
                )}
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


function formatarData(data) {

  if (!data) {
    return "-";
  }


  const [
    ano,
    mes,
    dia
  ] = data.split("-");


  return `${dia}/${mes}/${ano}`;

}


function calcularDias(data) {

  if (!data) {
    return "-";
  }


  const inicio =
    new Date(
      `${data}T00:00:00`
    );


  const hoje =
    new Date();


  hoje.setHours(
    0,
    0,
    0,
    0
  );


  const diferenca =
    hoje - inicio;


  const dias =
    Math.floor(
      diferenca /
      (1000 * 60 * 60 * 24)
    );


  if (
    dias < 0
  ) {
    return "-";
  }


  if (
    dias === 0
  ) {
    return "Hoje";
  }


  if (
    dias === 1
  ) {
    return "1 dia";
  }


  return `${dias} dias`;

}


function abrirMapa(src) {

  if (!src) {
    return;
  }


  mapModalImage.src =
    src;


  mapModal.classList.add(
    "active"
  );


  mapModal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );

}


function fecharMapa() {

  mapModal.classList.remove(
    "active"
  );


  mapModal.setAttribute(
    "aria-hidden",
    "true"
  );


  mapModalImage.src =
    "";


  document.body.classList.remove(
    "modal-open"
  );

}


function designarTerritorio() {

  alert(
    "Na próxima etapa criaremos a designação do território."
  );

}


function concluirTerritorio() {

  alert(
    "Na próxima etapa criaremos a conclusão do território."
  );

}


function mostrarErro(mensagem) {

  territoryTitle.textContent =
    "Erro";


  territoryLocation.textContent =
    mensagem;


  territoryStatus.textContent =
    "";


  mapWrapper.innerHTML =
    "";


  currentStatus.innerHTML =
    "";


  territoryActions.innerHTML =
    "";


  historyContent.innerHTML =
    "";

}


if (
  typeof mapModalClose !== "undefined"
  &&
  mapModalClose
) {

  mapModalClose.addEventListener(
    "click",
    fecharMapa
  );

}


if (
  typeof mapModal !== "undefined"
  &&
  mapModal
) {

  mapModal.addEventListener(
    "click",
    event => {

      if (
        event.target === mapModal
      ) {

        fecharMapa();

      }

    }
  );

}


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
      &&
      typeof mapModal !== "undefined"
      &&
      mapModal
      &&
      mapModal.classList.contains(
        "active"
      )
    ) {

      fecharMapa();

    }

  }
);



carregarTerritorio();