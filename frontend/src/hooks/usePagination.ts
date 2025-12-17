import { useState, useMemo } from 'react'

interface UsePaginationProps {
  initialPage?: number
  initialPageSize?: number
  totalItems: number
}

interface UsePaginationReturn {
  currentPage: number
  pageSize: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  previousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  startIndex: number
  endIndex: number
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 20,
  totalItems
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize))
  }, [totalItems, pageSize])

  const canGoNext = currentPage < totalPages
  const canGoPrevious = currentPage > 1

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const setPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    // Reset to first page when changing page size
    setCurrentPage(1)
  }

  const nextPage = () => {
    if (canGoNext) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const previousPage = () => {
    if (canGoPrevious) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)

  return {
    currentPage,
    pageSize,
    totalPages,
    setPage,
    setPageSize: handlePageSizeChange,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex
  }
}

export default usePagination
