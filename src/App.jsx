import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'nota_fiscal_vendas'
const STORAGE_CONTAS_PAGAR = 'nota_fiscal_contas_pagar'
const STORAGE_CONTAS_RECEBER = 'nota_fiscal_contas_receber'

const createItem = () => ({
  descricao: '',
  qtd: 1,
  valorUnitario: 0,
  desconto: 0,
  aliquota: 0,
})

const toNumber = (value) => {
  const normalized = Number.parseFloat(String(value).replace(',', '.'))
  return Number.isNaN(normalized) ? 0 : normalized
}

const money = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const PERIODS = [
  { id: 'today', label: 'Hoje' },
  { id: '7', label: '7 dias' },
  { id: '30', label: '30 dias' },
  { id: 'all', label: 'Geral' },
]

const createConta = () => ({
  descricao: '',
  valor: '',
  vencimento: new Date().toISOString().slice(0, 10),
})

function App() {
  const [cabecalho, setCabecalho] = useState({
    numero: '000001',
    serie: '1',
    dataEmissao: new Date().toISOString().slice(0, 10),
    formaPagamento: 'PIX',
  })

  const [emitente, setEmitente] = useState({
    razaoSocial: 'Casa Bia pet',
    cnpj: '54302078000190',
    ie: '',
    endereco: 'Jd.morumbi, AV. Benedito Bento n:740',
  })

  const [cliente, setCliente] = useState({
    nome: '',
    documento: '',
    endereco: '',
  })

  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState([createItem()])
  const [vendas, setVendas] = useState([])
  const [periodo, setPeriodo] = useState('30')
  const [feedback, setFeedback] = useState('')
  const [contasPagar, setContasPagar] = useState([])
  const [contasReceber, setContasReceber] = useState([])
  const [novaContaPagar, setNovaContaPagar] = useState(createConta())
  const [novaContaReceber, setNovaContaReceber] = useState(createConta())

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setVendas(parsed)
      } catch {
        setVendas([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas))
  }, [vendas])

  useEffect(() => {
    const rawPagar = localStorage.getItem(STORAGE_CONTAS_PAGAR)
    const rawReceber = localStorage.getItem(STORAGE_CONTAS_RECEBER)

    if (rawPagar) {
      try {
        const parsed = JSON.parse(rawPagar)
        if (Array.isArray(parsed)) setContasPagar(parsed)
      } catch {
        setContasPagar([])
      }
    }

    if (rawReceber) {
      try {
        const parsed = JSON.parse(rawReceber)
        if (Array.isArray(parsed)) setContasReceber(parsed)
      } catch {
        setContasReceber([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_CONTAS_PAGAR, JSON.stringify(contasPagar))
  }, [contasPagar])

  useEffect(() => {
    localStorage.setItem(STORAGE_CONTAS_RECEBER, JSON.stringify(contasReceber))
  }, [contasReceber])

  const itensCalculados = useMemo(
    () =>
      itens.map((item) => {
        const qtd = Math.max(toNumber(item.qtd), 0)
        const valorUnitario = Math.max(toNumber(item.valorUnitario), 0)
        const desconto = Math.max(toNumber(item.desconto), 0)
        const aliquota = Math.max(toNumber(item.aliquota), 0)
        const subtotal = qtd * valorUnitario
        const base = Math.max(subtotal - desconto, 0)
        const imposto = (base * aliquota) / 100

        return { ...item, qtd, valorUnitario, desconto, aliquota, subtotal, imposto }
      }),
    [itens],
  )

  const resumo = useMemo(() => {
    const subtotal = itensCalculados.reduce((acc, item) => acc + item.subtotal, 0)
    const descontos = itensCalculados.reduce((acc, item) => acc + item.desconto, 0)
    const impostos = itensCalculados.reduce((acc, item) => acc + item.imposto, 0)
    const totalLiquido = Math.max(subtotal - descontos + impostos, 0)

    return { subtotal, descontos, impostos, totalLiquido }
  }, [itensCalculados])

  const vendasFiltradas = useMemo(() => {
    if (periodo === 'all') return vendas

    const now = new Date()
    const start = new Date(now)

    if (periodo === 'today') {
      start.setHours(0, 0, 0, 0)
    } else {
      start.setDate(now.getDate() - Number(periodo))
    }

    return vendas.filter((venda) => new Date(venda.criadoEm) >= start)
  }, [periodo, vendas])

  const financeiro = useMemo(() => {
    const qtdVendas = vendasFiltradas.length
    const bruto = vendasFiltradas.reduce((acc, venda) => acc + venda.subtotal, 0)
    const descontos = vendasFiltradas.reduce((acc, venda) => acc + venda.descontos, 0)
    const impostos = vendasFiltradas.reduce((acc, venda) => acc + venda.impostos, 0)
    const liquido = vendasFiltradas.reduce((acc, venda) => acc + venda.totalLiquido, 0)
    const ticketMedio = qtdVendas ? liquido / qtdVendas : 0

    return { qtdVendas, bruto, descontos, impostos, liquido, ticketMedio }
  }, [vendasFiltradas])

  const resumoContas = useMemo(() => {
    const totalPagar = contasPagar.reduce((acc, conta) => acc + conta.valor, 0)
    const totalPagarPendente = contasPagar
      .filter((conta) => conta.status === 'PENDENTE')
      .reduce((acc, conta) => acc + conta.valor, 0)
    const totalPagarPago = contasPagar
      .filter((conta) => conta.status === 'PAGO')
      .reduce((acc, conta) => acc + conta.valor, 0)

    const totalReceber = contasReceber.reduce((acc, conta) => acc + conta.valor, 0)
    const totalReceberPendente = contasReceber
      .filter((conta) => conta.status === 'PENDENTE')
      .reduce((acc, conta) => acc + conta.valor, 0)
    const totalReceberRecebido = contasReceber
      .filter((conta) => conta.status === 'RECEBIDO')
      .reduce((acc, conta) => acc + conta.valor, 0)

    const saldoProjetado = financeiro.liquido + totalReceberPendente - totalPagarPendente

    return {
      totalPagar,
      totalPagarPendente,
      totalPagarPago,
      totalReceber,
      totalReceberPendente,
      totalReceberRecebido,
      saldoProjetado,
    }
  }, [contasPagar, contasReceber, financeiro.liquido])

  const updateCabecalho = (field, value) => {
    setCabecalho((prev) => ({ ...prev, [field]: value }))
  }

  const updateEmitente = (field, value) => {
    setEmitente((prev) => ({ ...prev, [field]: value }))
  }

  const updateCliente = (field, value) => {
    setCliente((prev) => ({ ...prev, [field]: value }))
  }

  const updateItem = (index, field, value) => {
    setItens((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    )
  }

  const addItem = () => setItens((prev) => [...prev, createItem()])

  const removeItem = (index) => {
    setItens((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))
  }

  const registrarVenda = () => {
    if (!itensCalculados.some((item) => item.descricao && item.qtd > 0)) {
      setFeedback('Adicione pelo menos um item valido para registrar a venda.')
      return
    }

    const novoRegistro = {
      id: `${Date.now()}`,
      notaNumero: cabecalho.numero,
      serie: cabecalho.serie,
      dataEmissao: cabecalho.dataEmissao,
      clienteNome: cliente.nome || 'Consumidor final',
      clienteDocumento: cliente.documento || '-',
      formaPagamento: cabecalho.formaPagamento,
      itens: itensCalculados
        .filter((item) => item.descricao && item.qtd > 0)
        .map((item) => ({
          descricao: item.descricao,
          qtd: item.qtd,
          valorUnitario: item.valorUnitario,
          total: Math.max(item.subtotal - item.desconto, 0),
        })),
      subtotal: resumo.subtotal,
      descontos: resumo.descontos,
      impostos: resumo.impostos,
      totalLiquido: resumo.totalLiquido,
      observacoes,
      criadoEm: new Date().toISOString(),
    }

    setVendas((prev) => [novoRegistro, ...prev])
    setFeedback('Venda registrada com sucesso no relatorio financeiro.')

    setCabecalho((prev) => ({
      ...prev,
      numero: String(Number(prev.numero || 0) + 1).padStart(6, '0'),
      dataEmissao: new Date().toISOString().slice(0, 10),
    }))
  }

  const adicionarContaPagar = () => {
    const valor = toNumber(novaContaPagar.valor)
    if (!novaContaPagar.descricao || valor <= 0) return

    setContasPagar((prev) => [
      {
        id: `${Date.now()}-pagar`,
        descricao: novaContaPagar.descricao,
        valor,
        vencimento: novaContaPagar.vencimento,
        status: 'PENDENTE',
      },
      ...prev,
    ])
    setNovaContaPagar(createConta())
  }

  const adicionarContaReceber = () => {
    const valor = toNumber(novaContaReceber.valor)
    if (!novaContaReceber.descricao || valor <= 0) return

    setContasReceber((prev) => [
      {
        id: `${Date.now()}-receber`,
        descricao: novaContaReceber.descricao,
        valor,
        vencimento: novaContaReceber.vencimento,
        status: 'PENDENTE',
      },
      ...prev,
    ])
    setNovaContaReceber(createConta())
  }

  const alterarStatusContaPagar = (id) => {
    setContasPagar((prev) =>
      prev.map((conta) =>
        conta.id === id
          ? { ...conta, status: conta.status === 'PAGO' ? 'PENDENTE' : 'PAGO' }
          : conta,
      ),
    )
  }

  const alterarStatusContaReceber = (id) => {
    setContasReceber((prev) =>
      prev.map((conta) =>
        conta.id === id
          ? { ...conta, status: conta.status === 'RECEBIDO' ? 'PENDENTE' : 'RECEBIDO' }
          : conta,
      ),
    )
  }

  return (
    <div className="nf-app">
      <header className="nf-header">
        <p className="nf-kicker">Emissao rapida</p>
        <h1>Nota Fiscal / Cupom Fiscal</h1>
        <p className="nf-subtitle">
          Preencha os dados da venda, confira os totais e imprima o documento.
        </p>
      </header>

      <main className="nf-grid">
        <section className="card">
          <h2>Cabecalho da Nota</h2>
          <div className="form-grid cols-4">
            <label>
              Numero
              <input
                value={cabecalho.numero}
                onChange={(e) => updateCabecalho('numero', e.target.value)}
              />
            </label>
            <label>
              Serie
              <input
                value={cabecalho.serie}
                onChange={(e) => updateCabecalho('serie', e.target.value)}
              />
            </label>
            <label>
              Data de emissao
              <input
                type="date"
                value={cabecalho.dataEmissao}
                onChange={(e) => updateCabecalho('dataEmissao', e.target.value)}
              />
            </label>
            <label>
              Pagamento
              <select
                value={cabecalho.formaPagamento}
                onChange={(e) => updateCabecalho('formaPagamento', e.target.value)}
              >
                <option>PIX</option>
                <option>Cartao</option>
                <option>Dinheiro</option>
                <option>Boleto</option>
              </select>
            </label>
          </div>
        </section>

        <section className="card">
          <h2>Emitente</h2>
          <div className="form-grid cols-2">
            <label>
              Razao social
              <input value={emitente.razaoSocial} readOnly />
            </label>
            <label>
              CNPJ
              <input value={emitente.cnpj} readOnly />
            </label>
            <label>
              IE
              <input value={emitente.ie} onChange={(e) => updateEmitente('ie', e.target.value)} />
            </label>
            <label>
              Endereco
              <input value={emitente.endereco} readOnly />
            </label>
          </div>
        </section>

        <section className="card">
          <h2>Cliente</h2>
          <div className="form-grid cols-2">
            <label>
              Nome
              <input value={cliente.nome} onChange={(e) => updateCliente('nome', e.target.value)} />
            </label>
            <label>
              CPF/CNPJ
              <input
                value={cliente.documento}
                onChange={(e) => updateCliente('documento', e.target.value)}
              />
            </label>
            <label className="span-2">
              Endereco
              <input
                value={cliente.endereco}
                onChange={(e) => updateCliente('endereco', e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <div className="row-between">
            <h2>Itens</h2>
            <button className="btn btn-ghost" type="button" onClick={addItem}>
              + Adicionar item
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Descricao</th>
                  <th>Qtd</th>
                  <th>Unitario</th>
                  <th>Desconto</th>
                  <th>Aliq. %</th>
                  <th>Subtotal</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {itensCalculados.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        value={item.descricao}
                        placeholder="Produto ou servico"
                        onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.qtd}
                        onChange={(e) => updateItem(index, 'qtd', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.valorUnitario}
                        onChange={(e) => updateItem(index, 'valorUnitario', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.desconto}
                        onChange={(e) => updateItem(index, 'desconto', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.aliquota}
                        onChange={(e) => updateItem(index, 'aliquota', e.target.value)}
                      />
                    </td>
                    <td className="money">{money(Math.max(item.subtotal - item.desconto, 0))}</td>
                    <td>
                      <button className="btn btn-danger" type="button" onClick={() => removeItem(index)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2>Resumo financeiro</h2>
          <div className="resume-grid">
            <article>
              <span>Subtotal</span>
              <strong>{money(resumo.subtotal)}</strong>
            </article>
            <article>
              <span>Descontos</span>
              <strong>{money(resumo.descontos)}</strong>
            </article>
            <article>
              <span>Impostos</span>
              <strong>{money(resumo.impostos)}</strong>
            </article>
            <article className="highlight">
              <span>Total</span>
              <strong>{money(resumo.totalLiquido)}</strong>
            </article>
          </div>
          <label className="obs">
            Observacoes
            <textarea
              rows="3"
              value={observacoes}
              placeholder="Informacoes complementares da venda"
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </label>
          {!!feedback && <p className="feedback">{feedback}</p>}
          <div className="actions actions-2">
            <button className="btn btn-primary" type="button" onClick={registrarVenda}>
              Registrar venda
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
              Emitir e imprimir cupom
            </button>
          </div>
        </section>

        <section className="card">
          <div className="row-between">
            <h2>Relatorio financeiro</h2>
            <div className="filters">
              {PERIODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`filter-btn ${periodo === item.id ? 'active' : ''}`}
                  onClick={() => setPeriodo(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="resume-grid">
            <article>
              <span>Vendas</span>
              <strong>{financeiro.qtdVendas}</strong>
            </article>
            <article>
              <span>Faturamento bruto</span>
              <strong>{money(financeiro.bruto)}</strong>
            </article>
            <article>
              <span>Total de descontos</span>
              <strong>{money(financeiro.descontos)}</strong>
            </article>
            <article>
              <span>Impostos acumulados</span>
              <strong>{money(financeiro.impostos)}</strong>
            </article>
            <article className="highlight">
              <span>Faturamento liquido</span>
              <strong>{money(financeiro.liquido)}</strong>
            </article>
            <article>
              <span>Ticket medio</span>
              <strong>{money(financeiro.ticketMedio)}</strong>
            </article>
            <article>
              <span>Contas a pagar (pendente)</span>
              <strong>{money(resumoContas.totalPagarPendente)}</strong>
            </article>
            <article>
              <span>Contas a receber (pendente)</span>
              <strong>{money(resumoContas.totalReceberPendente)}</strong>
            </article>
            <article className="highlight">
              <span>Saldo projetado</span>
              <strong>{money(resumoContas.saldoProjetado)}</strong>
            </article>
          </div>
        </section>

        <section className="card">
          <h2>Contas a pagar</h2>
          <div className="finance-form-grid">
            <input
              placeholder="Descricao da conta"
              value={novaContaPagar.descricao}
              onChange={(e) =>
                setNovaContaPagar((prev) => ({ ...prev, descricao: e.target.value }))
              }
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor"
              value={novaContaPagar.valor}
              onChange={(e) => setNovaContaPagar((prev) => ({ ...prev, valor: e.target.value }))}
            />
            <input
              type="date"
              value={novaContaPagar.vencimento}
              onChange={(e) =>
                setNovaContaPagar((prev) => ({ ...prev, vencimento: e.target.value }))
              }
            />
            <button className="btn btn-primary" type="button" onClick={adicionarContaPagar}>
              Adicionar
            </button>
          </div>
          <p className="mini-resumo">
            Total: {money(resumoContas.totalPagar)} | Pendente: {money(resumoContas.totalPagarPendente)} | Pago:{' '}
            {money(resumoContas.totalPagarPago)}
          </p>
          <div className="finance-list">
            {contasPagar.map((conta) => (
              <article key={conta.id}>
                <div>
                  <strong>{conta.descricao}</strong>
                  <p>Vencimento: {conta.vencimento}</p>
                </div>
                <div className="conta-actions">
                  <span className={`status ${conta.status === 'PAGO' ? 'ok' : 'warn'}`}>
                    {conta.status}
                  </span>
                  <strong>{money(conta.valor)}</strong>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => alterarStatusContaPagar(conta.id)}
                  >
                    {conta.status === 'PAGO' ? 'Marcar pendente' : 'Marcar pago'}
                  </button>
                </div>
              </article>
            ))}
            {!contasPagar.length && <p className="empty-state">Nenhuma conta a pagar cadastrada.</p>}
          </div>
        </section>

        <section className="card">
          <h2>Contas a receber</h2>
          <div className="finance-form-grid">
            <input
              placeholder="Descricao da conta"
              value={novaContaReceber.descricao}
              onChange={(e) =>
                setNovaContaReceber((prev) => ({ ...prev, descricao: e.target.value }))
              }
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor"
              value={novaContaReceber.valor}
              onChange={(e) => setNovaContaReceber((prev) => ({ ...prev, valor: e.target.value }))}
            />
            <input
              type="date"
              value={novaContaReceber.vencimento}
              onChange={(e) =>
                setNovaContaReceber((prev) => ({ ...prev, vencimento: e.target.value }))
              }
            />
            <button className="btn btn-primary" type="button" onClick={adicionarContaReceber}>
              Adicionar
            </button>
          </div>
          <p className="mini-resumo">
            Total: {money(resumoContas.totalReceber)} | Pendente: {money(resumoContas.totalReceberPendente)} |
            Recebido: {money(resumoContas.totalReceberRecebido)}
          </p>
          <div className="finance-list">
            {contasReceber.map((conta) => (
              <article key={conta.id}>
                <div>
                  <strong>{conta.descricao}</strong>
                  <p>Vencimento: {conta.vencimento}</p>
                </div>
                <div className="conta-actions">
                  <span className={`status ${conta.status === 'RECEBIDO' ? 'ok' : 'warn'}`}>
                    {conta.status}
                  </span>
                  <strong>{money(conta.valor)}</strong>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => alterarStatusContaReceber(conta.id)}
                  >
                    {conta.status === 'RECEBIDO' ? 'Marcar pendente' : 'Marcar recebido'}
                  </button>
                </div>
              </article>
            ))}
            {!contasReceber.length && <p className="empty-state">Nenhuma conta a receber cadastrada.</p>}
          </div>
        </section>

        <section className="card">
          <h2>Relatorio de vendas</h2>
          {!vendasFiltradas.length ? (
            <p className="empty-state">Nenhuma venda registrada neste periodo.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Nota</th>
                    <th>Cliente</th>
                    <th>Pagamento</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasFiltradas.map((venda) => (
                    <tr key={venda.id}>
                      <td>{formatDateTime(venda.criadoEm)}</td>
                      <td>{`${venda.notaNumero}/${venda.serie}`}</td>
                      <td>{venda.clienteNome}</td>
                      <td>{venda.formaPagamento}</td>
                      <td className="money">{money(venda.totalLiquido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card cupom-preview">
          <h2>Pre-visualizacao do cupom</h2>
          <div className="ticket">
            <p className="ticket-title">{emitente.razaoSocial || 'Emitente'}</p>
            <p>CNPJ: {emitente.cnpj || 'Nao informado'}</p>
            <p>IE: {emitente.ie || 'Nao informado'}</p>
            <p>{emitente.endereco || 'Endereco nao informado'}</p>
            <hr />
            <p>
              Nota {cabecalho.numero} - Serie {cabecalho.serie}
            </p>
            <p>Data: {cabecalho.dataEmissao || '-'}</p>
            <p>Pagamento: {cabecalho.formaPagamento}</p>
            <p>Cliente: {cliente.nome || 'Consumidor final'}</p>
            <p>Documento: {cliente.documento || '-'}</p>
            <hr />
            {itensCalculados.map((item, index) => (
              <p key={index}>
                {(item.descricao || 'Item') + ' x' + item.qtd} -{' '}
                {money(Math.max(item.subtotal - item.desconto, 0))}
              </p>
            ))}
            <hr />
            <p>Subtotal: {money(resumo.subtotal)}</p>
            <p>Descontos: {money(resumo.descontos)}</p>
            <p>Impostos: {money(resumo.impostos)}</p>
            <p className="ticket-total">TOTAL: {money(resumo.totalLiquido)}</p>
            {!!observacoes && (
              <>
                <hr />
                <p>Obs: {observacoes}</p>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
