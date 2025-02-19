import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const instituicao = "Fernando Card";
    const nomeCliente = "joão da Silva"
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://saudeecor.i9.dev.br/white/login.php", { waitUntil: "networkidle2" });
    page.on('dialog', async (dialog) => {
      console.log(`Alerta detectado: ${dialog.message()}`);
      await dialog.dismiss(); // Ou use dialog.accept() se precisar confirmar
    });
    await page.type('input[name="usuario"]', '020.314.821-57');
    await page.type('input[name="senha"]', '102030');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);
    // console.log("Login realizado com sucesso!");

    // await page.waitForSelector('a[data-widget="pushmenu"]', { visible: true });
    // await page.click('a[data-widget="pushmenu"]');
    // console.log("Ícone de menu clicado!");

    // await page.waitForSelector('a.nav-link', { visible: true });
    // await page.evaluate(() => {
    //   const cadastroLink = Array.from(document.querySelectorAll('a.nav-link')).find(
    //     (el) => el.textContent?.trim() === "Vendas"
    //   );
    //   if (cadastroLink) (cadastroLink as HTMLElement).click();
    // });

    // await page.waitForSelector('a.nav-link', { visible: true });
    // await page.evaluate(() => {
    //   const empresaLink = Array.from(document.querySelectorAll('a.nav-link')).find(
    //     (el) => el.textContent?.trim() === "Consultar & Vender"
    //   );
    //   if (empresaLink) (empresaLink as HTMLElement).click();
    // });

    await page.evaluate((instituicao) => {
      const options = Array.from(document.querySelectorAll('#seq_instituicao option'));
      const optionToSelect = options.find(option => option.textContent?.trim() === instituicao);
      if (optionToSelect) {
        (optionToSelect as HTMLOptionElement).selected = true;
        const selectElement = document.querySelector('#seq_instituicao');
        if (selectElement) {
          selectElement.dispatchEvent(new Event('change'));
        }
      } else {
        console.error(`Instituição "${instituicao}" não encontrada.`);
      }
    }, instituicao);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await page.waitForSelector("#btn_pesquisar", { visible: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const button = await page.$("#btn_pesquisar");
    if (button) {
      const boundingBox = await button.boundingBox();
      if (boundingBox) {
        await page.mouse.click(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
      } else {
      }
    } else {
      console.error("Botão #btn_voltar não encontrado.");
    }


    await page.waitForSelector('#divClienteVinculo .btn-primary', { visible: true });
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Uma pequena pausa, se necessário
    const clienteButton = await page.$('#divClienteVinculo .btn-primary');
    if (clienteButton) {
      const boundingBox = await clienteButton.boundingBox();
      if (boundingBox) {
        await page.mouse.click(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
        console.log("Botão 'Escolher Cliente' clicado!");
      } else {
        console.error("BoundingBox do botão 'Escolher Cliente' não encontrado.");
      }
    } else {
      console.error("Botão 'Escolher Cliente' não encontrado.");
    }

    await page.evaluate((instituicao) => {
      const options = Array.from(document.querySelectorAll('#seq_instituicao_cli option'));
      const optionToSelect = options.find(option => option.textContent?.trim() === instituicao);
      if (optionToSelect) {
        (optionToSelect as HTMLOptionElement).selected = true;
        const selectElement = document.querySelector('#seq_instituicao_cli');
        if (selectElement) {
          selectElement.dispatchEvent(new Event('change'));
        }
      } else {
        console.error(`Instituição "${instituicao}" não encontrada.`);
      }
    }, instituicao);

    await page.waitForSelector('#nom_cliente', { visible: true });
    await page.type('#nom_cliente', nomeCliente);

    await page.click('button[onclick="getCliente();"]');
    await page.waitForSelector('.table .btn-primary', { visible: true });
    await page.click('.table .btn-primary');

    console.log("Esperando pelo seletor...");
    await page.waitForSelector('.timeline-footer .btn-warning', { visible: true });
    console.log("Seletor encontrado. Buscando o botão...");
    const escolherProduto = await page.$('.timeline-footer .btn-warning');
    if (!escolherProduto) {
      console.error("Botão não encontrado.");
    } else {
      console.log("Botão encontrado. Tentando clicar...");
      await page.evaluate((element) => (element as HTMLElement).click(), escolherProduto);
      console.log("Clique executado.");
    }



    await page.evaluate((instituicao) => {
      const options = Array.from(document.querySelectorAll('#seq_instituicao option'));
      const optionToSelect = options.find(option => option.textContent?.trim() === instituicao);
      if (optionToSelect) {
        (optionToSelect as HTMLOptionElement).selected = true;
        const selectElement = document.querySelector('#seq_instituicao');
        if (selectElement) {
          selectElement.dispatchEvent(new Event('change'));
        }
      } else {
        console.error(`Instituição "${instituicao}" não encontrada.`);
      }
    }, instituicao);

    await new Promise((resolve) => setTimeout(resolve, 4000));

    const vincularProduto = await page.$('.btn-primary[data-toggle="tooltip"]');
    if (vincularProduto) {
      await vincularProduto.evaluate(node => {
        (node as HTMLElement).click();
      });
    }





    return res.status(200).json({ message: "Integração concluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao executar Puppeteer:", error);
    return res.status(500).json({ error: "Erro ao executar integração" });
  }
}
