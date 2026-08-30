let territorios = [];

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


    territorios =
      await resposta.json();


    // Procura alterações salvas
    // no navegador.

    const dadosLocais =
      localStorage.getItem(
        "territorios"
      );


    if (dadosLocais) {

      try {

        territorios =
          JSON.parse(
            dadosLocais
          );

      } catch (erro) {

        console.warn(
          "Não foi possível carregar os dados locais.",
          erro
        );

      }

    }


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
// RESUMO
// ===============================

function atualizarResumo() {

  const disponiveis =
    territorios.filter(
      territorio =>
        territorio.status ===
        "disponivel"
    ).length;


  const emUso =
    territorios.filter(
      territorio =>
        territorio.status ===
        "uso"
    ).length;


  const atencao =
    territorios.filter(
      territorio =>
        territorio.status ===
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
    !lista ||
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


      let statusTexto = "";

      let statusClasse = "";


      if (
        territorio.status ===
        "disponivel"
      ) {

        statusTexto =
          "Disponível";

        statusClasse =
          "available";

      }


      if (
        territorio.status ===
        "uso"
      ) {

        statusTexto =
          "Em uso";

        statusClasse =
          "in-use";

      }


      if (
        territorio.status ===
        "atencao"
      ) {

        statusTexto =
          "Atenção";

        statusClasse =
          "warning";

      }


      let detalhes = "";


      if (
        territorio.status ===
        "disponivel"
      ) {

        detalhes = `

          <p>
            Pronto para designação
          </p>

        `;

      }


      if (
        territorio.status ===
        "uso"
      ) {

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

        `;

      }


      if (
        territorio.status ===
        "atencao"
      ) {

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

            Há:
            <strong>
              ${
                tempoUso !== "-"
                  ? tempoUso
                  : `${territorio.diasUso || 0} dias`
              }
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
  ) {

    return "-";

  }


  const [
    ano,
    mes,
    dia
  ] = partes;


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


        const correspondeStatus =
          status ===
            "todos"
          ||
          territorio.status ===
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
// NOVA MOVIMENTAÇÃO
// ===============================

function obterDataHoje() {

  const hoje = new Date();

  const ano =
    hoje.getFullYear();

  const mes =
    String(
      hoje.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      hoje.getDate()
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


function abrirNovaMovimentacao() {

  if (
    !newMovementModal ||
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
        territorio.status ===
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
    movementResponsible.value = "";
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


  if (movementTerritory) {
    movementTerritory.focus();
  }

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


function salvarTerritorios() {

  localStorage.setItem(
    "territorios",
    JSON.stringify(
      territorios
    )
  );

}


function confirmarNovaMovimentacao(
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
    !territorioId ||
    !responsavel ||
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
    territorio.status !==
    "disponivel"
  ) {

    alert(
      "Este território não está disponível."
    );

    return;
  }


  territorio.status =
    "uso";

  territorio.responsavel =
    responsavel;

  territorio.dataDesignacao =
    dataDesignacao;


  salvarTerritorios();

  atualizarResumo();

  aplicarFiltros();

  fecharNovaMovimentacao();


  alert(
    `Território ${territorio.numero} designado para ${responsavel}.`
  );

}

// ===============================
// EVENTOS
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
// NOVA MOVIMENTAÇÃO
// ===============================

function obterDataHoje() {

  const hoje = new Date();

  const ano =
    hoje.getFullYear();

  const mes =
    String(
      hoje.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      hoje.getDate()
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


function abrirNovaMovimentacao() {

  if (
    !newMovementModal ||
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
        territorio.status ===
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
    movementResponsible.value = "";
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


  if (movementTerritory) {
    movementTerritory.focus();
  }

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


function salvarTerritorios() {

  localStorage.setItem(
    "territorios",
    JSON.stringify(
      territorios
    )
  );

}


function confirmarNovaMovimentacao(
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
    !territorioId ||
    !responsavel ||
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
    territorio.status !==
    "disponivel"
  ) {

    alert(
      "Este território não está disponível."
    );

    return;
  }


  territorio.status =
    "uso";

  territorio.responsavel =
    responsavel;

  territorio.dataDesignacao =
    dataDesignacao;


  salvarTerritorios();

  atualizarResumo();

  aplicarFiltros();

  fecharNovaMovimentacao();


  alert(
    `Território ${territorio.numero} designado para ${responsavel}.`
  );

}

// ===============================
// INICIALIZAÇÃO
// ===============================

carregarTerritorios();