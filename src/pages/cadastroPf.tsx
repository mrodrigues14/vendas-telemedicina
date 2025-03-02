import { useState, useEffect } from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import TelaCarregamento from "@/components/telaCarregamento/TelaCarregamento";
import PaymentLinkPopup from "@/components/paymentLinkPopup/PaymentLinkPopup";

export default function CadastroPf() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    celular: "",
    nascimento: "",
    cep: "",
    endereco: "",
    casa: "",
    sexo: "",
    uf: "",
    cidade: "",
    formaPagamento: "",
  });
  const [erros, setErros] = useState<{ [key: string]: string }>({});
  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((res) => res.json())
      .then((data) => {
        setEstados(data.map((estado: any) => ({ sigla: estado.sigla, nome: estado.nome })));
      });
  }, []);

  useEffect(() => {
    if (formData.uf) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.uf}/municipios`)
        .then((res) => res.json())
        .then((data) => setCidades(data.map((cidade: any) => cidade.nome)));
    }
  }, [formData.uf]);

  useEffect(() => {
    if (/^\d{5}-\d{3}$/.test(formData.cep)) {
      fetch(`https://viacep.com.br/ws/${formData.cep.replace("-", "")}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            setFormData((prev) => ({
              ...prev,
              endereco: data.logradouro,
              uf: data.uf,
              cidade: data.localidade,
            }));
            setErros((prev) => ({ ...prev, cep: "" }));
          } else {
            setErros((prev) => ({ ...prev, cep: "CEP inválido!" }));
          }
        })
        .catch(() => setErros((prev) => ({ ...prev, cep: "Erro ao buscar CEP" })));
    } else {
      setFormData((prev) => ({ ...prev, endereco: "", uf: "", cidade: "" }));
    }
  }, [formData.cep]);

  // Função para formatar CPF
  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, "") // Remove tudo que não é número
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // Função para formatar Telefone
  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, "") // Remove tudo que não é número
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  };

  // Função para formatar Data de Nascimento
  const formatNascimento = (value: string) => {
    return value
      .replace(/\D/g, "") // Remove tudo que não é número
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
  };

  const formatCep = (value: string) => {
    return value
      .replace(/\D/g, "") // Remove tudo que não é número
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9); // Garante que o CEP não tenha mais de 9 caracteres
  };


  const handleChangeFormat = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    if (name === "cpf") value = formatCpf(value);
    if (name === "celular") value = formatTelefone(value);
    if (name === "nascimento") value = formatNascimento(value);

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, uf: e.target.value, cidade: "" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar dados");
      }

      alert("Cadastro realizado com sucesso!");
    } catch (error) {
      alert("Erro ao enviar os dados. Tente novamente.");
    }
  };
  const nextStep = async () => {
    if (currentStep === 1) {
      setLoading(true); // Ativa o indicador de carregamento
      try {
        const response = await fetch('/api/saudeECorCadastroPF', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            cpf: formData.cpf,
            celular: formData.celular,
            cep: formData.cep,
            endereco: formData.endereco,
            uf: formData.uf,
            cidade: formData.cidade,
            nome: formData.nome,
            sexo: formData.sexo,
            dataNascimento: formData.nascimento,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao enviar os dados');
        }
      } catch (error) {
        console.error('Erro ao enviar os dados para /api/saudeECorCadastroPF:', error);
        return;
      } finally {
        setLoading(false); // Desativa o indicador de carregamento
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const steps = ["Dados Pessoais", "Endereço", "Pagamento"];

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Venda Individual
        </Typography>

        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box mt={4}>
          {currentStep === 0 && (
            <>
              <Typography variant="h6" align="center" gutterBottom>
                Preencha as informações pessoais
              </Typography>
              {[
                { label: "Nome", name: "nome", type: "text" },
                { label: "E-mail", name: "email", type: "email" },
                { label: "CPF", name: "cpf", type: "text" },
                { label: "Celular", name: "celular", type: "text", placeholder: "(DD) 12345-1234" },
                { label: "Data de nascimento", name: "nascimento", type: "text", placeholder: "DD/MM/AAAA" },
              ].map(({ label, name, type, placeholder }) => (
                <Box className="mb-3" key={name}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type}
                    className="form-control"
                    name={name}
                    value={formData[name as keyof typeof formData]}
                    onChange={handleChangeFormat}
                    placeholder={placeholder}
                    required
                  />
                </Box>
              ))}
              <Box className="mb-3">
                <label className="form-label">Gênero</label>
                <select
                  className="form-control"
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleChangeFormat}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </Box>
            </>

          )}

          {currentStep === 1 && (
            <>
              <Typography variant="h6" align="center" gutterBottom>
                Preencha o endereço
              </Typography>
              {[
                { label: "CEP", name: "cep", type: "text" },
                { label: "Endereço", name: "endereco", type: "text", disabled: true },
                { label: "Casa", name: "casa", type: "text", placeholder: "Número da casa" },
              ].map(({ label, name, type, placeholder, disabled }) => (
                <Box className="mb-3" key={name}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type}
                    className="form-control"
                    name={name}
                    value={formData[name as keyof typeof formData]}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Adicione aqui a formatação do CEP
                      const formattedValue =
                        name === "cep"
                          ? value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9)
                          : value;
                      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    required
                  />
                </Box>
              ))}

              <Box className="mb-3">
                <label className="form-label">Estado</label>
                <select
                  className="form-control"
                  name="uf"
                  value={formData.uf}
                  onChange={handleUfChange}
                  required
                >
                  <option value="">Selecione o Estado</option>
                  {estados.map((estado) => (
                    <option key={estado.sigla} value={estado.sigla}>
                      {estado.nome}
                    </option>
                  ))}
                </select>
              </Box>

              <Box className="mb-3">
                <label className="form-label">Cidade</label>
                <select
                  className="form-control"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChangeFormat}
                  required
                >
                  <option value="">Selecione a Cidade</option>
                  {cidades.map((cidade, index) => (
                    <option key={index} value={cidade}>
                      {cidade}
                    </option>
                  ))}
                </select>
              </Box>
            </>
          )}


          {currentStep === 2 && (
            <>
              <Typography variant="h6" align="center" gutterBottom>
                Pagamento
              </Typography>
              <Typography align="center">Selecione uma forma de pagamento:</Typography>
              <Box className="text-center mt-3">
                <Box className="mb-3">
                  <div>
                    <input
                      type="radio"
                      id="cartao"
                      name="formaPagamento"
                      value="cartao"
                      onChange={handleChangeFormat}
                      checked={formData.formaPagamento === "cartao"}
                    />
                    <label htmlFor="cartao">Cartão de Crédito</label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      id="pix"
                      name="formaPagamento"
                      value="pix"
                      onChange={handleChangeFormat}
                      checked={formData.formaPagamento === "pix"}
                    />
                    <label htmlFor="pix">Pix</label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      id="boleto"
                      name="formaPagamento"
                      value="boleto"
                      onChange={handleChangeFormat}
                      checked={formData.formaPagamento === "boleto"}
                    />
                    <label htmlFor="boleto">Boleto</label>
                  </div>
                </Box>
              </Box>
              <Box className="text-center mt-4">
                <Button
                  variant="contained"
                  color="success"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await fetch('/api/saudeECorSubirVida', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          nomeCliente: formData.nome,
                          formaDePagamento: formData.formaPagamento,
                        }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao gerar o link de pagamento');
                      }

                      const data = await response.json();
                      if (data.paymentLink) {
                        setPaymentLink(data.paymentLink);
                        setShowPopup(true); // Mostra o popup
                      } else {
                        alert('Erro: o link de pagamento não foi retornado.');
                      }
                    } catch (error) {
                      alert('Erro ao gerar o link de pagamento.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Gerar link de pagamento
                </Button>

              </Box>
            </>
          )}


        </Box>

        {/* BOTÕES DE NAVEGAÇÃO */}
        <Box className="d-flex justify-content-between mt-4">
          {currentStep > 0 && (
            <Button variant="outlined" color="secondary" onClick={prevStep}>
              Voltar
            </Button>
          )}
          {currentStep < 2 && (
            <Button variant="contained" sx={{ backgroundColor: "rgb(181, 205, 0)" }} onClick={nextStep}>
              Avançar
            </Button>
          )}
        </Box>
      </Paper>
      {loading && <TelaCarregamento />}
      <PaymentLinkPopup
        show={showPopup}
        onClose={() => setShowPopup(false)}
        paymentLink={paymentLink}
      />
    </Container>
  );
}
