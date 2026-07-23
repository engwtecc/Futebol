import { useEffect, useState } from "react";

import { api } from "../services/api";

import { Jogador } from "../types/Jogador";

export function useJogadores(){

    const [jogadores,setJogadores] = useState<Jogador[]>([]);

    const [loading,setLoading] = useState(true);

    async function carregar(){

        setLoading(true);

        try{

            const dados = await api.get("/jogadores");

            setJogadores(dados);

        }finally{

            setLoading(false);

        }

    }

    useEffect(()=>{

        carregar();

    },[]);

    return{

        jogadores,

        loading,

        atualizar:carregar

    }

}