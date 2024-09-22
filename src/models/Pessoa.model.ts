import { Status } from "../enum/Status";
import { Funcoes } from "./Funcoes.model";

export type Pessoa = {
    nome: string;
    status: Status;
    funcoes: Funcoes[];
};
