import styled from '@emotion/styled';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import React from 'react';
import useLocalStorage, { LocalStorageStateKey } from '../hooks/useLocalStorage';

export type ConfigCustomTable = {
    key: string;
    label: string;
    width?: string;
    minWidth?: string;
    customTemplate?: (data: any, config: ConfigCustomTable) => React.ReactElement;
    convertFn?: (data: any, config: ConfigCustomTable) => string;
};

type Props = {
    localSotorageKey: LocalStorageStateKey;
    config: ConfigCustomTable[];
};

const TableCustom = ({ config, localSotorageKey }: Props) => {
    const { get } = useLocalStorage();
    const rows = get(localSotorageKey);

    return (
        <TableContainer component={Paper} sx={{ height: '80vh' }}>
            <Table sx={{ minWidth: 650 }} stickyHeader >
                <TableHead>
                    <StyledTableRow>
                        {config.map(c => (
                            <TableCell
                                key={`${c.key}-header`}
                                sx={{
                                    width: c.width,
                                    minWidth: c.minWidth,
                                }}
                            >
                                {c.label}
                            </TableCell>
                        ))}
                    </StyledTableRow>
                </TableHead>
                <TableBody>
                    {!!rows.length && rows.map((row, indexRow) => (
                        <StyledTableRow
                            key={indexRow}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >

                            {config.map(c => (
                                <TableCell
                                    key={`${c.key}-${indexRow}-item`}
                                    sx={{
                                        width: c.width,
                                        minWidth: c.minWidth,
                                    }}
                                >
                                    {!!c.customTemplate && c.customTemplate(row, c)}
                                    {!c.customTemplate && (row as any)[c.key]?.toUpperCase()}
                                </TableCell>
                            ))}
                        </StyledTableRow>
                    ))}

                    {!rows.length && (
                        <StyledTableRow
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="td" scope="row">
                                Nenhum resultado encontrado
                            </TableCell>

                        </StyledTableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TableCustom;

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: (theme as any).palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));
