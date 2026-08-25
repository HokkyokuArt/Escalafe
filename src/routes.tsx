import { createBrowserRouter, Navigate } from "react-router-dom";
import BaseComponent from "./components/BaseComponent";
import Configuracoes from "./pages/Configuracoes";
import ErrorPage from "./pages/ErrorPage";
import EscalaEditor from "./pages/EscalaEditor";
import Escalas from "./pages/Escalas";
import Funcoes from "./pages/Funcoes";
import Pessoas from "./pages/Pessoas";
import SemanasEspeciais from "./pages/SemanasEspeciais";

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
            {
                path: 'semanas-especiais',
                element: <SemanasEspeciais />,
                id: 'Semanas Especiais',
            },
            {
                path: 'configuracoes',
                element: <Configuracoes />,
                id: 'Configurações',
            },
            {
                path: 'escalas',
                element: <Escalas />,
                id: 'Escalas',
            },
            {
                path: 'escalas/nova',
                element: <EscalaEditor />,
                id: 'Nova Escala',
            },
            {
                path: 'escalas/:id',
                element: <EscalaEditor />,
                id: 'Editar Escala',
            },
        ]
    }
]);

export type RoutesName = '/home' | '/pessoas' | '/funcoes' | '/semanas-especiais' | '/configuracoes' | '/escalas';
export type RoutesInfo = { label: string; path: string, icon: string; };
export type RoutesInfoMap = Record<RoutesName, RoutesInfo>;

export const routesInfo: RoutesInfoMap = {
    ['/home']: {
        path: '/home',
        label: 'Home',
        icon: 'fa-solid fa-house',
    },
    ['/escalas']: {
        path: '/escalas',
        label: 'Escalas',
        icon: 'fa-solid fa-calendar-days',
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
    },
    ['/semanas-especiais']: {
        path: '/semanas-especiais',
        label: 'Semanas Especiais',
        icon: 'fa-solid fa-star',
    },
    ['/configuracoes']: {
        path: '/configuracoes',
        label: 'Configurações',
        icon: 'fa-solid fa-sliders',
    },
};
