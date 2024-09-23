import { Autocomplete, Box, Button, Checkbox, Chip, FormControl, FormGroup, TextField, useTheme } from "@mui/material";
import { useState } from "react";
import CustomDialog, { DialogProps } from "../components/CustomDialog";
import FloatingActionsComponent, { FloatingActions } from "../components/FloatingActions";
import TableCustom, { ConfigCustomTable, OptionsRow } from "../components/TableCustom";
import { Status } from "../enum/Status";
import useGenerateID from "../hooks/useGenerateID";
import useLocalStorage from "../hooks/useLocalStorage";
import { Funcao } from "../models/Funcao.model";
import { Pessoa } from "../models/Pessoa.model";
import { sortArray } from "../utils/utils";

type FuncaoLocalState = null | Partial<Funcao> & { pessoas: Pessoa[]; };

const Funcoes = () => {
    const dialogUseState = useState(false);
    const [_, setDialogState] = dialogUseState;
    const [novaFuncao, setNovaFuncao] = useState<FuncaoLocalState>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [formError, setFormError] = useState<{ nome: boolean; }>({ nome: false });
    const [shouldUpdateRows, setShouldUpdateRows] = useState(false);
    const { get, set } = useLocalStorage();
    const { getNewId } = useGenerateID();
    const theme = useTheme();
    const pessoaOptions = sortArray(get('pessoas'), { fieldToSort: 'nome' });

    const setDialogOpen = (open: boolean) => {
        setDialogState(open);
    };

    const addNovaFuncao = () => {
        setNovaFuncao({ id: getNewId('funcoes'), nome: '', status: Status.ATIVO, pessoas: [] });
    };

    const resetFuncao = () => {
        setFormError({ nome: false });
        setNovaFuncao(null);
    };

    const saveFuncao = () => {
        if (!novaFuncao?.nome) {
            setFormError({ nome: true });
            return;
        }

        const funcoes = Array.from(get('funcoes'));
        if ((!editing && funcoes.find(p => p.nome === novaFuncao.nome))
            || (!!funcoes.find(p => p.nome === novaFuncao.nome && p.id != novaFuncao.id))
        ) {
            setFormError({ nome: true });
            return;
        }

        const { pessoas, ...funcao } = novaFuncao;

        if (!editing) {
            funcoes.push(funcao as Funcao);
        } else {
            const foundIndex = funcoes.findIndex(p => p.id === funcao.id);
            if (foundIndex !== -1) {
                funcoes[foundIndex] = funcao as Funcao;
            }
        }
        set('funcoes', funcoes);
        setFuncaoInPessoas();
        resetFuncao();
        setDialogOpen(false);
        setShouldUpdateRows(true);
    };

    const setFuncaoInPessoas = () => {
        const { pessoas, ...funcao } = novaFuncao!;
        pessoaOptions.forEach(opt => {
            const found = pessoas.find(p => p.id === opt.id);
            if (found) {
                opt.funcoes.push(funcao as Funcao);
            } else {
                opt.funcoes = opt.funcoes.filter(f => f.id !== funcao.id);
            }
        });

        set('pessoas', pessoaOptions);
    };

    const config: ConfigCustomTable[] = [
        {
            key: 'nome',
            label: 'Nome',
        },
    ];

    const dialogNovoProps: DialogProps = {
        state: dialogUseState,
        onClose: () => {
            resetFuncao();
        },
        content: {
            header: "Adicionar função",
            body: <Box>
                <FormGroup>
                    <FormControl error={formError.nome}>
                        <TextField
                            color="secondary"
                            fullWidth
                            id="nome"
                            label="Nome *"
                            variant="standard"
                            error={formError.nome}
                            sx={{
                                mb: '20px'
                            }}
                            value={novaFuncao?.nome ?? ''}
                            onChange={event => {
                                const value = event.target.value?.toUpperCase();
                                setNovaFuncao(prev => ({
                                    ...prev,
                                    pessoas: prev?.pessoas ?? [],
                                    nome: value
                                }));
                            }}
                        />
                    </FormControl>

                    <FormControl>
                        <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={pessoaOptions}
                            fullWidth
                            value={novaFuncao?.pessoas ?? []}
                            onChange={(_, value) => {
                                setNovaFuncao(prev => ({
                                    ...prev,
                                    pessoas: value
                                }));
                            }}
                            getOptionLabel={(option) => option.nome}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    color="secondary"
                                    label="Pessoas"
                                    variant="standard"
                                    sx={{
                                        mb: '20px'
                                    }}
                                />
                            }
                            renderOption={(props, option, { selected }) => {
                                const { key, ...optionProps } = props;
                                return (
                                    <li key={option.id} {...optionProps}>
                                        <Checkbox
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        {option.nome}
                                    </li>
                                );
                            }}

                            renderTags={(value, getTagProps) =>
                                value.map((option, index: number) => {
                                    const tagProps = getTagProps({ index });
                                    return (
                                        <Chip
                                            {...tagProps}
                                            label={option.nome}
                                            key={option.id}
                                            color="primary"
                                        />
                                    );
                                })
                            }

                        />
                    </FormControl>

                </FormGroup>
            </Box>,
            footer: <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '20px'
                }}>
                <Button variant="contained" color="error" onClick={() => { resetFuncao(); setDialogOpen(false); }}>
                    Cancelar
                </Button>
                <Button variant="contained" color="success" onClick={saveFuncao}>Salvar</Button>
            </Box>
        }
    };

    const optionsRow: OptionsRow[] = [
        {
            id: 'ativar-inativa',
            icon: row => {
                return row.status === Status.ATIVO
                    ? 'fa-solid fa-circle-check'
                    : 'fa-solid fa-circle-xmark';
            },
            color: row => {
                return row.status === Status.ATIVO
                    ? theme.palette.success.main
                    : theme.palette.error.main;
            },
            label: row => {
                return row.status === Status.ATIVO
                    ? 'Ativo'
                    : 'Intativo';
            },
            onClick: row => {
                const funcoes = get('funcoes');
                const found = funcoes.find(p => p.id === row.id);
                if (found) {
                    found.status = row.status === Status.ATIVO
                        ? Status.INATIVO
                        : Status.ATIVO;
                }

                set('funcoes', funcoes);
                setShouldUpdateRows(true);
            }
        },
        {
            id: 'editar',
            icon: () => 'fa-solid fa-pencil',
            color: () => theme.palette.info.main,
            label: () => 'Editar',
            onClick: row => {
                const toSet: FuncaoLocalState = {
                    ...row,
                    pessoas: pessoaOptions.filter(p => !!p.funcoes.find(f => f.id === row.id)),
                };
                setEditing(true);
                setDialogOpen(true);
                setNovaFuncao(toSet);
            }
        },
        {
            id: 'excluir',
            icon: () => 'fa-solid fa-trash-can',
            color: () => theme.palette.error.main,
            label: () => 'Excluir',
            onClick: row => {
                const funcoes = get('funcoes');
                const filteredFuncoes = funcoes.filter(p => p.id !== row.id);
                set('funcoes', filteredFuncoes);
                pessoaOptions.forEach(p => {
                    p.funcoes = p.funcoes.filter(f => f.id !== row.id);
                });
                set('pessoas', pessoaOptions);
                setShouldUpdateRows(true);
            }
        },
    ];

    const fa: FloatingActions = [
        {
            id: 'novo',
            icon: 'fa-solid fa-plus',
            label: 'Novo',
            onClick: () => {
                setEditing(false);
                setDialogOpen(true);
                addNovaFuncao();
            }
        }
    ];

    return (
        <>
            <TableCustom
                localStorageKey='funcoes'
                config={config}
                optionsRow={optionsRow}
                shouldUpdate={shouldUpdateRows}
                setShouldUpdate={setShouldUpdateRows}
            />
            <FloatingActionsComponent floatingActions={fa} />
            <CustomDialog {...dialogNovoProps} />
        </>
    );
};

export default Funcoes;
