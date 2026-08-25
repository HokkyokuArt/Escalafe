import { Status } from "../enum/Status";
import { RGB } from "./PdfConfig.model";

export type Posicao = {
    id: number;
    nome: string;
};

export type Funcao = {
    id: number;
    nome: string;
    status: Status;
    posicoes: Posicao[];
    corPar?: RGB;
    corImpar?: RGB;
    corFonte?: RGB;
    designacaoSemana?: boolean;
    rotatividadeMaxima?: boolean;
};
