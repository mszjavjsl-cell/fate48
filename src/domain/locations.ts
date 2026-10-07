export interface BirthLocation {
  id: string
  name: string
  longitude: number
}

export const KOREAN_BIRTH_LOCATIONS: BirthLocation[] = [
  { id: 'seoul', name: '서울', longitude: 126.978 },
  { id: 'busan', name: '부산', longitude: 129.0756 },
  { id: 'daegu', name: '대구', longitude: 128.6014 },
  { id: 'incheon', name: '인천', longitude: 126.7052 },
  { id: 'gwangju', name: '광주', longitude: 126.8526 },
  { id: 'daejeon', name: '대전', longitude: 127.3845 },
  { id: 'ulsan', name: '울산', longitude: 129.3114 },
  { id: 'sejong', name: '세종', longitude: 127.289 },
  { id: 'suwon', name: '수원', longitude: 127.0286 },
  { id: 'chuncheon', name: '춘천', longitude: 127.7298 },
  { id: 'cheongju', name: '청주', longitude: 127.489 },
  { id: 'jeonju', name: '전주', longitude: 127.148 },
  { id: 'mokpo', name: '목포', longitude: 126.3922 },
  { id: 'andong', name: '안동', longitude: 128.7294 },
  { id: 'changwon', name: '창원', longitude: 128.6811 },
  { id: 'gangneung', name: '강릉', longitude: 128.8761 },
  { id: 'jeju', name: '제주', longitude: 126.5312 },
]

export const DEFAULT_BIRTH_LOCATION = KOREAN_BIRTH_LOCATIONS[0]

export function getBirthLocation(id: string): BirthLocation {
  return KOREAN_BIRTH_LOCATIONS.find((location) => location.id === id) ?? DEFAULT_BIRTH_LOCATION
}
