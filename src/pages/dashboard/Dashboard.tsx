import Card from "../../components/ui/Card";

export default function Dashboard() {

    return (

        <div>

            <h1 className="text-3xl font-bold mb-8">

                Dashboard

            </h1>

            <div className="grid grid-cols-4 gap-6">

                <Card
                    title="Jogadores"
                    value="0"
                />

                <Card
                    title="Na fila"
                    value="0"
                />

                <Card
                    title="Em jogo"
                    value="0"
                />

                <Card
                    title="Partidas"
                    value="0"
                />

            </div>

            <div className="mt-8 bg-white rounded-xl shadow p-6">

                <h2 className="font-bold text-xl mb-4">

                    Última Partida

                </h2>

                <p>

                    Nenhuma partida realizada.

                </p>

            </div>

        </div>

    );

}