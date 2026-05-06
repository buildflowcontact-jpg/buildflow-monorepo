import * as React from "react"

import { ThemeProvider as NextThemesProvider } from "next-themes"

type AppThemeProviderProps = {
  children?: React.ReactNode
  [key: string]: any
}

export function ThemeProvider({ children, ...props }: AppThemeProviderProps) {
  const AnyThemeProvider = NextThemesProvider as any
  return <AnyThemeProvider {...props}>{children}</AnyThemeProvider>
}
