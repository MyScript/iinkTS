
export const isVersionSuperiorOrEqual = (source: string, target: string): boolean => {
  const sourceParts = source.split(".")
  const targetParts = target.split(".")

  for (let i = 0; i < targetParts.length; i++) {
    const a = Number(targetParts[i])
    const b = Number(sourceParts[i])
    if (a > b) return false
    if (a < b) return true
  }
  return true
}
