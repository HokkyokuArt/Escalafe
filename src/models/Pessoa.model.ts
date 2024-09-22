import { Status } from "../enum/Status";
import { Funcoes } from "./Funcoes.model";

export type Pessoa = {
    id: number;
    nome: string;
    status: Status;
    funcoes: Funcoes[];
};
