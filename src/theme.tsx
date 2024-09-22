import { createTheme } from "@mui/material";

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#5e0000',
        },
        secondary: {
            main: '#d65e5e',
        },

        text: {
            // primary: '#00FFFF'
        }
    },
    components: {
        MuiTypography: {
            styleOverrides: {
                root: {
                    color: '#fff'
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    color: '#fff',
                },
            },

        }
    },
});
