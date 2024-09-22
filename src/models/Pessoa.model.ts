import { Status } from "../enum/Status";
import { Funcao } from "./Funcao.model";

export type Pessoa = {
    id: number;
    nome: string;
    status: Status;
    funcoes: Funcao[];
};
