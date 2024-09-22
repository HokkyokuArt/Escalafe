import { createBrowserRouter, Navigate } from "react-router-dom";
import BaseComponent from "./components/BaseComponent";
import ErrorPage from "./pages/ErrorPage";
import Funcoes from "./pages/Funcoes";
import Pessoas from "./pages/Pessoas";

export const routes = createBrowserRouter([
    {
        path: '/',
        element: <BaseComponent />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: '',
                element: <Navigate to={'home'} />,
                id: '_redirectHome'
            },
            {
                path: 'home',
                element: <h1>HOME</h1>,
                id: 'Home',
            },
            {
                path: 'pessoas',
                element: <Pessoas />,
                id: 'Pessoas',
            },
            {
                path: 'funcoes',
                element: <Funcoes />,
                id: 'Funções',
            },
        ]
    }
]);

export type RoutesName = '/home' | '/pessoas' | '/funcoes';
export type RoutesInfo = { label: string; path: string, icon: string; };
export type RoutesInfoMap = Record<RoutesName, RoutesInfo>;

export const routesInfo: RoutesInfoMap = {
    ['/home']: {
        path: '/home',
        label: 'Home',
        icon: 'fa-solid fa-house',
    },
    ['/pessoas']: {
        path: '/pessoas',
        label: 'Pessoas',
        icon: 'fa-solid fa-user-tie',
    },
    ['/funcoes']: {
        path: '/funcoes',
        label: 'Funções',
        icon: 'fa-solid fa-gears',
    }
};
