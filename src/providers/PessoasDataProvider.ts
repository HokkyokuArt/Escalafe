import { Status } from "../enum/Status";
import { Pessoa } from "../models/Pessoa.model";
import { funcoes } from "./FuncoesDataProvider";

export const pessoas: Pessoa[] = [
    {
        id: 0,
        nome: 'JEAN ARTICO',
        status: Status.ATIVO,
        funcoes: funcoes,
    },
    {
        id: 1,
        nome: 'NICOLAS AZEVEDO',
        status: Status.ATIVO,
        funcoes: funcoes,
    },
    {
        id: 2,
        nome: 'PESSOA 1',
        status: Status.ATIVO,
        funcoes: [funcoes[0], funcoes[1], funcoes[2]],
    },
    {
        id: 3,
        nome: 'PESSOA 2',
        status: Status.INATIVO,
        funcoes: [funcoes[3], funcoes[4], funcoes[5]],
    },
];
