import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, TextField } from "@mui/material";
import Grid from '@mui/material/Grid2';
import { useState } from "react";
import CustomDialog, { DialogProps } from "../components/CustomDialog";
import FloatingActionsComponent, { FloatingActions } from "../components/FloatingActions";
import TableCustom, { ConfigCustomTable, OptionsRow } from "../components/TableCustom";
import { Status } from "../enum/Status";
import useGenerateID from "../hooks/useGenerateID";
import useLocalStorage from "../hooks/useLocalStorage";
import { Funcoes } from "../models/Funcoes.model";
import { Pessoa } from "../models/Pessoa.model";
import { sortArray } from "../utils/utils";

const Pessoas = () => {
    const dialogUseState = useState(false);
    const [_, setDialogState] = dialogUseState;
    const [novaPessoa, setNovaPessoa] = useState<null | Partial<Pessoa>>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [formError, setFormError] = useState<{ nome: boolean; }>({ nome: false });
    const [shouldUpdateRows, setShouldUpdateRows] = useState(false);
    const { get, set } = useLocalStorage();
    const { getNewId } = useGenerateID();

    const setDialogOpen = (open: boolean) => {
        setDialogState(open);
    };

    const funcoes = sortArray(get('funcoes'), { fieldToSort: 'nome' });
    const resetPessoa = () => {
        setFormError({ nome: false });
        setNovaPessoa(null);
    };

    const addNovaPessoa = () => {
        setNovaPessoa({ id: getNewId('pessoas'), nome: '', funcoes: [], status: Status.ATIVO });
    };

    const onChangeCheckbox = (checked: boolean, funcao: Funcoes) => {
        setNovaPessoa(prev => {
            const funcoesCopy = prev?.funcoes?.slice() ?? [];
            const funcoesToSet = checked
                ? [...funcoesCopy, funcao]
                : funcoesCopy?.filter(f => f.nome !== funcao.nome);

            return { ...prev, funcoes: funcoesToSet };
        });
    };

    const savePessoa = () => {
        if (!novaPessoa?.nome) {
            setFormError({ nome: true });
            return;
        }

        const pessoas = Array.from(get('pessoas'));
        if ((!editing && pessoas.find(p => p.nome === novaPessoa.nome))
            || (!!pessoas.find(p => p.nome === novaPessoa.nome && p.id != novaPessoa.id))
        ) {
            setFormError({ nome: true });
            return;
        }

        if (!editing) {
            pessoas.push(novaPessoa as Pessoa);
        } else {
            const foundIndex = pessoas.findIndex(p => p.id === novaPessoa.id);
            if (foundIndex !== -1) {
                pessoas[foundIndex] = novaPessoa as Pessoa;
            }
        }
        set('pessoas', pessoas);
        resetPessoa();
        setDialogOpen(false);
        setShouldUpdateRows(true);
    };

    const config: ConfigCustomTable[] = [
        {
            key: 'nome',
            label: 'Nome',
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
                addNovaPessoa();
            }
        }
    ];

    const dialogNovoProps: DialogProps = {
        state: dialogUseState,
        onClose: () => {
            resetPessoa();
        },
        content: {
            header: "Adicionar pessoa",
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
                            value={novaPessoa?.nome ?? ''}
                            onChange={event => {
                                const value = event.target.value?.toUpperCase();
                                setNovaPessoa(prev => ({ ...prev, nome: value }));
                            }}
                        />
                    </FormControl>

                    <Grid container spacing={2}>
                        {funcoes.map((funcao, index) => {
                            return <Grid size={4} key={index}>
                                <FormControlLabel
                                    control={<Checkbox
                                        color="secondary"
                                        checked={!!novaPessoa?.funcoes?.find(f => f.nome === funcao.nome)}
                                        onChange={(_, checked) => { onChangeCheckbox(checked, funcao); }}
                                    />}
                                    label={funcao.nome} />
                            </Grid>;
                        }
                        )}

                    </Grid>
                </FormGroup>
            </Box>,
            footer: <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '20px'
                }}>
                <Button variant="contained" onClick={() => { resetPessoa(); setDialogOpen(false); }}>
                    Cancelar
                </Button>
                <Button variant="contained" color="success" onClick={savePessoa}>Salvar</Button>
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
                    ? 'green'
                    : 'red';
            },
            label: row => {
                return row.status === Status.ATIVO
                    ? 'Ativo'
                    : 'Intativo';
            },
            onClick: row => {
                const pessoas = get('pessoas');
                const found = pessoas.find(p => p.id === row.id);
                if (found) {
                    found.status = row.status === Status.ATIVO
                        ? Status.INATIVO
                        : Status.ATIVO;
                }

                set('pessoas', pessoas);
                setShouldUpdateRows(true);
            }
        },
        {
            id: 'editar',
            icon: () => 'fa-solid fa-pencil',
            color: () => '#b5e1ff',
            label: () => 'Editar',
            onClick: row => {
                setEditing(true);
                setDialogOpen(true);
                setNovaPessoa(row);
            }
        },
        {
            id: 'excluir',
            icon: () => 'fa-solid fa-trash-can',
            color: () => 'red',
            label: () => 'Excluir',
            onClick: row => {
                const pessoas = get('pessoas');
                const filteredPessoas = pessoas.filter(p => p.id !== row.id);
                set('pessoas', filteredPessoas);
                setShouldUpdateRows(true);
            }
        },
    ];

    return (
        <>
            <TableCustom
                localStorageKey='pessoas'
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

export default Pessoas;
