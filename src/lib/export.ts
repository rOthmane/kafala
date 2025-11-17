import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * Exporte des données en CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
): void {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exporte des données en XLSX
 */
export function exportToXLSX<T extends Record<string, any>>(
  data: T[],
  filename: string
): void {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Données')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

