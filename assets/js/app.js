let territorios = [];

const grid = document.getElementById("territoriesGrid");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");

const totalTerritorios = document.getElementById("totalTerritorios");
const totalDisponiveis = document.getElementById("totalDisponiveis");
const totalEmUso = document.getElementById("totalEmUso");
const totalAtencao = document.getElementById("totalAtencao");

async function carregarTerritorios() {
  try {
    const resposta = await fetch("data/territorios.json");

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar os territórios.");
    }

    territorios = await resposta.json();

    atualizarResumo();
    renderizarTerritorios(territorios);
  } catch (erro) {
    console.error(erro);

    grid.innerHTML = `
      <p>Não foi possível carregar os territórios.</p>
    `;
  }
}

function atualizarResumo() {
  const disponiveis = territorios.filter(
    territorio => territorio.status === "disponivel"
  ).length;

  const emUso = territorios.filter(
    territorio => territorio.status === "uso"
  ).length;

  const atencao = territorios.filter(
    territorio => territorio.status === "atencao"
  ).length;

  totalTerritorios.textContent = territorios.length;
  totalDisponiveis.textContent = disponiveis;
  totalEmUso.textContent = emUso;
  totalAtencao.textContent = atencao;
}

function renderizarTerritorios(lista) {
  grid.innerHTML = "";

  if (lista.length === 0) {
    grid.innerHTML = `
      <p>Nenhum território encontrado.</p>
    `;
    return;
  }

  lista.forEach(territorio => {
    const card = document.createElement("article");
    card.classList.add("territory-card");

    let statusTexto = "";
    let statusClasse = "";

    if (territorio.status === "disponivel") {
      statusTexto = "Disponível";
      statusClasse = "available";
    }

    if (territorio.status === "uso") {
      statusTexto = "Em uso";
      statusClasse = "in-use";
    }

    if (territorio.status === "atencao") {
      statusTexto = "Atenção";
      statusClasse = "warning";
    }

    let detalhes = "";

    if (territorio.status === "disponivel") {
      detalhes = `
        <p>Pronto para designação</p>
      `;
    }

    if (territorio.status === "uso") {
      detalhes = `
        <p>
          Designado para:
          <strong>${territorio.responsavel || "-"}</strong>
        </p>

        <p>
          Desde:
          <strong>${formatarData(territorio.dataDesignacao)}</strong>
        </p>
      `;
    }

    if (territorio.status === "atencao") {
      detalhes = `
        <p>
          Designado para:
          <strong>${territorio.responsavel || "-"}</strong>
        </p>

        <p>
          Há:
          <strong>${territorio.diasUso || 0} dias</strong>
        </p>
      `;
    }

    card.innerHTML = `
      <div class="territory-top">
        <span class="territory-number">
          Território ${territorio.numero}
        </span>

        <span class="status ${statusClasse}">
          ${statusTexto}
        </span>
      </div>

      <h3>${territorio.localidade}</h3>

      ${detalhes}

      <button
        class="btn-secondary"
        onclick="abrirTerritorio(${territorio.id})"
      >
        Abrir território
      </button>
    `;

    grid.appendChild(card);
  });
}

function formatarData(data) {
  if (!data) {
    return "-";
  }

  const [ano, mes, dia] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function aplicarFiltros() {
  const busca = searchInput.value
    .toLowerCase()
    .trim();

  const status = statusFilter.value;

  const resultado = territorios.filter(territorio => {
    const correspondeBusca =
      territorio.numero.includes(busca) ||
      territorio.localidade.toLowerCase().includes(busca);

    const correspondeStatus =
      status === "todos" ||
      territorio.status === status;

    return correspondeBusca && correspondeStatus;
  });

  renderizarTerritorios(resultado);
}

function abrirTerritorio(id) {
  window.location.href = `territorio.html?id=${id}`;
}

  // Na próxima etapa vamos abrir a tela individual.


searchInput.addEventListener("input", aplicarFiltros);
statusFilter.addEventListener("change", aplicarFiltros);

carregarTerritorios();