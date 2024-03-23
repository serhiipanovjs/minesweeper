export const fieldGenerator = (height: any, width: any, defaultNumber = 0) => {
  const arr = [] as any
  for (let i = 0; i < height; i++) {
    arr[i] = []
    for (let j = 0; j < width; j++) {
      arr[i][j] = defaultNumber
    }
  }
  return arr
}