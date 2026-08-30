# Gestão de Territórios

Aplicação web para gerenciamento, acompanhamento e registro de designações de territórios.

O projeto foi desenvolvido para substituir controles manuais baseados em cartões e planilhas, centralizando em uma única interface o estado dos territórios, suas movimentações, histórico e informações necessárias para o **Registro de Designação de Território (S-13)**.

---

## Visão geral

O sistema permite acompanhar os territórios cadastrados e visualizar rapidamente quais estão:

- Disponíveis para designação
- Em uso
- Em atenção devido ao tempo de utilização

Cada território possui uma página individual com informações sobre sua situação atual, mapa e histórico de movimentações.

O sistema também mantém os registros necessários para consulta e geração do relatório S-13.

---

## Funcionalidades atuais

### Painel de controle

O painel principal apresenta:

- Total de territórios cadastrados
- Quantidade disponível
- Quantidade em uso
- Territórios que precisam de atenção
- Busca por território
- Filtro por situação
- Acesso rápido aos detalhes de cada território

### Designação de territórios

Um território disponível pode ser designado informando:

- Responsável
- Data da designação

Após a designação, o território passa automaticamente para o estado **Em uso**.

### Conclusão

Quando um território é concluído:

- A data de conclusão é registrada
- A movimentação é preservada no histórico
- O território volta a ficar disponível para uma nova designação

### Histórico

Cada território mantém seu próprio histórico de movimentações, permitindo consultar:

- Responsável
- Data da designação
- Data da conclusão

Os registros anteriores são preservados mesmo após novas designações.

### Controle de tempo

O sistema calcula automaticamente há quanto tempo um território está em uso.

Territórios que ultrapassam o período definido para acompanhamento podem ser destacados como **Atenção**.

### Mapas

Cada território pode possuir seu próprio mapa para consulta durante a organização e utilização do território.

Os mapas ficam armazenados separadamente dentro da estrutura do projeto.

### Relatório S-13

O sistema possui uma tela dedicada ao:

**Registro de Designação de Território — S-13**

O relatório utiliza as movimentações registradas no sistema para organizar informações como:

- Número do território
- Última data concluída
- Responsável pela designação
- Data da designação
- Data da conclusão
- Ano de serviço

Também está prevista a impressão ou geração do relatório em PDF.

---

## Fluxo do sistema

```text
Disponível
    ↓
Designar território
    ↓
Em uso
    ↓
Acompanhamento
    ↓
Concluir território
    ↓
Registrar no histórico
    ↓
Disponível novamente