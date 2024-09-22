import { Status } from "../enum/Status";
import { Funcao } from "../models/Funcao.model";

export const funcoes: Funcao[] = [
    {
        id: 0,
        nome: 'MICROFONE',
        status: Status.ATIVO
    },
    {
        id: 1,
        nome: 'ÁUDIO',
        status: Status.ATIVO
    },
    {
        id: 2,
        nome: 'VÍDEO',
        status: Status.ATIVO
    },
    {
        id: 3,
        nome: 'LEITOR',
        status: Status.ATIVO
    },
    {
        id: 4,
        nome: 'LAYOUT DE PALCO',
        status: Status.ATIVO
    },
    {
        id: 4,
        nome: 'INDICADOR',
        status: Status.ATIVO
    },
];
