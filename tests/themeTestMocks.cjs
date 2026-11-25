const typography = require("./typographyTestValues.cjs");

const appThemeMock = {
  getAppColorScheme: () => "light",
  getThemeMode: () => "system",
  setThemeMode: () => {},
  observeSystemTheme: () => () => {},
  createThemeValue: (create) => {
    let value;
    return () => (value ??= create());
  },
};
const appThemeHookMock = { useAppTheme: () => "light" };

function getThemeTestMock(request) {
  if (request.endsWith("/typography")) return typography;
  if (request.endsWith("/lib/appTheme")) return appThemeMock;
  if (request.endsWith("/hooks/useAppTheme")) return appThemeHookMock;
}

module.exports = { appThemeMock, appThemeHookMock, getThemeTestMock, typography };
