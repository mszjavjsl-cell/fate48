import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('Manse application', () => {
  it('shows the default birth data as a four-pillar chart', () => {
    render(<App />)

    expect(screen.queryByLabelText('표준 시간대')).not.toBeInTheDocument()
    for (const englishSubLabel of [
      'PRECISION CALENDAR · LOCAL LAB',
      'PROFILE',
      'BIRTH DATA',
      'FOUR PILLARS',
      'CALCULATION TRACE',
      'FORTUNE TIMELINE',
      'SELECTED ANNUAL FORTUNE',
    ]) {
      expect(screen.queryByText(englishSubLabel)).not.toBeInTheDocument()
    }
    const board = screen.getByRole('group', { name: '사주 원국' })
    expect(within(board).getByText('癸')).toBeInTheDocument()
    expect(within(board).getByText('酉')).toBeInTheDocument()
    expect(within(board).getByText('丙')).toBeInTheDocument()
    expect(within(board).getByText('辰')).toBeInTheDocument()
    expect(screen.getByText(/망종/)).toBeInTheDocument()

    const hourPillar = within(board).getByRole('group', { name: '시주 丙辰' })
    expect(within(hourPillar).getByText('재성')).toBeInTheDocument()
    expect(within(hourPillar).getByText('정재')).toBeInTheDocument()
    expect(within(hourPillar).getByText('관성')).toBeInTheDocument()
    expect(within(hourPillar).getByText('정관')).toBeInTheDocument()
    expect(within(hourPillar).getByText('양화')).toBeInTheDocument()
    expect(within(hourPillar).getByText('양토')).toBeInTheDocument()
  })

  it('accepts yyyymmddhhmm digits and shows the formatted birth information', async () => {
    const user = userEvent.setup()
    render(<App />)

    const digits = screen.getByLabelText('생년월일시분 숫자 12자리')
    await user.clear(digits)
    await user.type(digits, '1986년04월02일 15:25')
    expect(digits).toHaveValue('198604021525')
    await user.click(screen.getByLabelText('남성'))
    await user.click(screen.getByRole('button', { name: '만세력 계산' }))

    const board = screen.getByRole('group', { name: '사주 원국' })
    expect(within(board).getByText('寅')).toBeInTheDocument()
    expect(screen.getByText(/청명/)).toBeInTheDocument()
    expect(screen.getByText(/1987년 3월 11일/)).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: '출생정보' })).getByText('양력 1986년 4월 2일 15시 25분')).toBeInTheDocument()
  })

  it('switches to lunar input and calculates from the converted solar date', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByLabelText('음력'))
    expect(screen.getByLabelText('윤달')).toBeInTheDocument()
    const digits = screen.getByLabelText('생년월일시분 숫자 12자리')
    await user.clear(digits)
    await user.type(digits, '198904090715')
    await user.click(screen.getByRole('button', { name: '만세력 계산' }))

    const birthInfo = screen.getByRole('group', { name: '출생정보' })
    expect(within(birthInfo).getByText('음력 1989년 4월 9일 07시 15분')).toBeInTheDocument()
    expect(within(birthInfo).getByText('양력 환산 1989년 5월 13일')).toBeInTheDocument()
    const board = screen.getByRole('group', { name: '사주 원국' })
    expect(within(board).getByText('癸')).toBeInTheDocument()
    expect(within(board).getByText('酉')).toBeInTheDocument()
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
