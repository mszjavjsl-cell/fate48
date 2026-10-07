import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('Manse application', () => {
  it('shows the default birth data as a four-pillar chart', () => {
    render(<App />)

    const board = screen.getByRole('group', { name: '사주 원국' })
    expect(within(board).getByText('癸')).toBeInTheDocument()
    expect(within(board).getByText('酉')).toBeInTheDocument()
    expect(within(board).getByText('丙')).toBeInTheDocument()
    expect(within(board).getByText('辰')).toBeInTheDocument()
    expect(screen.getByText(/망종/)).toBeInTheDocument()
  })

  it('recalculates when birth data is submitted', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText('양력 생년월일'))
    await user.type(screen.getByLabelText('양력 생년월일'), '1986-04-02')
    await user.clear(screen.getByLabelText('출생 시각'))
    await user.type(screen.getByLabelText('출생 시각'), '15:25')
    await user.click(screen.getByLabelText('남성'))
    await user.click(screen.getByRole('button', { name: '만세력 계산' }))

    const board = screen.getByRole('group', { name: '사주 원국' })
    expect(within(board).getByText('寅')).toBeInTheDocument()
    expect(screen.getByText(/청명/)).toBeInTheDocument()
    expect(screen.getByText(/1987년 3월 11일/)).toBeInTheDocument()
  })

  it('changes the annual list and detail when decade and year are clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    const decade = screen.getByRole('button', { name: /辛未 대운.*2007년 시작.*19세/ })
    await user.click(decade)
    expect(decade).toHaveAttribute('aria-pressed', 'true')

    const annual = screen.getByRole('button', { name: /2007년.*19세.*丁亥 세운/ })
    await user.click(annual)
    expect(annual).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: '2007년 세운' })).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: '선택한 세운 간지' })).getByText('丁亥')).toBeInTheDocument()
  })
})
