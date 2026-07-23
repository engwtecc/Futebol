const API = "https://futebol-hawai.up.railway.app";

async function request(
    url: string,
    options?: RequestInit
) {

    const response = await fetch(API + url, {

        headers: {

            "Content-Type": "application/json"

        },

        ...options

    });

    if (!response.ok) {

        const erro = await response.text();

        throw new Error(erro);

    }

    if (response.status === 204)

        return null;

    return response.json();

}

export const api = {

    get(url: string) {

        return request(url);

    },

    post(url: string, body: any) {

        return request(url, {

            method: "POST",

            body: JSON.stringify(body)

        });

    },

    patch(url: string, body: any) {

        return request(url, {

            method: "PATCH",

            body: JSON.stringify(body)

        });

    },

    put(url: string, body: any) {

        return request(url, {

            method: "PUT",

            body: JSON.stringify(body)

        });

    },

    delete(url: string) {

        return request(url, {

            method: "DELETE"

        });

    }

};