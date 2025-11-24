import api from "./api";

export async function login(username: string, password: string) {
  const response = await api.post("/login", { username, password });
  return response.data; // espera vir medicoId / token
}

export async function registerMedico(data: any) {
  const response = await api.post("/medicos", data);
  return response.data;
}
