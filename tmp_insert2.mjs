import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Need to use service_role to bypass RLS, publishable key might not bypass RLS for inserts if it's protected
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const raw_data = `01/03/2026 08:05 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 70,00 | Transferência Interna
28/02/2026 22:29 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 628,78 | Transferência Interna
28/02/2026 22:21 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 135,91 | Transferência Interna
28/02/2026 20:33 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 20,00 | Transferência Interna
28/02/2026 20:33 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 446,91 | Transferência Interna
26/02/2026 09:51 | Rinaldo Pedroso | THIAGO LIMA DE OLIVEIRA | 129,00 | Entrada Externa
22/02/2026 21:48 | BoraCorrerClub | Beatriz Lima Barros | 149,00 | Entrada Externa
22/02/2026 16:42 | BoraCorrerClub | Maria Simone Sousa | 162,12 | Entrada Externa
22/02/2026 13:50 | BoraCorrerClub | Jose Moura | 172,50 | Entrada Externa
22/02/2026 12:07 | BoraCorrerClub | Rafael S Chavasco | 165,82 | Entrada Externa
22/02/2026 11:57 | BoraCorrerClub | (Não informado) | 169,16 | Entrada Externa
22/02/2026 06:42 | BoraCorrerClub | Zilmar Nascimento dos Santos | 158,65 | Entrada Externa
21/02/2026 19:50 | BoraCorrerClub | RENATO MOURA FELICIANO | 295,70 | Entrada Externa
21/02/2026 17:54 | Rinaldo Pedroso | Haline de Castro Vitorino | 89,90 | Entrada Externa
21/02/2026 16:05 | Rinaldo Pedroso | BRUNA LETICIA BARBOSA C SILVA | 149,00 | Entrada Externa
21/02/2026 13:40 | BoraCorrerClub | ESTER ALVES OLIVEIRA VASQUES | 158,65 | Entrada Externa
21/02/2026 13:35 | BoraCorrerClub | Juliana figueiredo | 154,34 | Entrada Externa
21/02/2026 13:00 | BoraCorrerClub | SIMONE ROSA VIEIRA | 158,65 | Entrada Externa
21/02/2026 12:54 | BoraCorrerClub | ANDREA FIGUEIREDO | 147,85 | Entrada Externa
21/02/2026 12:48 | BoraCorrerClub | THIAGO LIMA DE OLIVEIRA | 160,55 | Entrada Externa
21/02/2026 12:39 | BoraCorrerClub | Fernanda do c Lopes | 169,16 | Entrada Externa
21/02/2026 12:09 | BoraCorrerClub | André Caires | 165,82 | Entrada Externa
21/02/2026 11:31 | BoraCorrerClub | VIVIAN SARKIS PONTES LINO | 147,85 | Entrada Externa
21/02/2026 11:19 | BoraCorrerClub | NATALIA DO NASCIMENTO LIMA | 68,85 | Entrada Externa
21/02/2026 11:16 | BoraCorrerClub | Kamilla C P Gomes | 169,16 | Entrada Externa
21/02/2026 11:11 | BoraCorrerClub | LUCINARA C LOURENCO | 170,83 | Entrada Externa
21/02/2026 11:09 | BoraCorrerClub | André Caires | 165,82 | Entrada Externa
21/02/2026 11:09 | BoraCorrerClub | FERNANDO FIGUEIREDO FERREIRA | 147,85 | Entrada Externa
20/02/2026 09:01 | Rinaldo Pedroso | LARISSA L R SANTOS | 103,35 | Entrada Externa
20/02/2026 04:17 | BoraCorrerClub | TOTAL PASS PARTICIPACOES LTDA | 69,60 | Entrada Externa
19/02/2026 16:11 | BoraCorrerClub | LUANA OATEN DA COSTA COELHO | 99,00 | Entrada Externa
16/02/2026 14:33 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 360,01 | Transferência Interna
13/02/2026 18:33 | BoraCorrerClub | JOAO MENDES SARGENTO NETO | 300,00 | Entrada Externa
13/02/2026 14:22 | BoraCorrerClub | Carlos Vinicius Verissimo Pinheiro dos Santos | 55,00 | Entrada Externa
12/02/2026 20:56 | BoraCorrerClub | LUCAS ALVES DE JESUS FRANCA | 55,00 | Entrada Externa
12/02/2026 20:56 | BoraCorrerClub | TANIA APARECIDA DOS REIS FERREIRA | 55,00 | Entrada Externa
12/02/2026 19:45 | BoraCorrerClub | DANIEL DE SANTANA TEIXEIRA | 55,00 | Entrada Externa
12/02/2026 16:47 | BoraCorrerClub | Joao Mendes Sargento Neto | 60,00 | Entrada Externa
12/02/2026 09:02 | BoraCorrerClub | JENNIFER MENESES DE AGUIAR CUNHA | 9,97 | Entrada Externa
11/02/2026 16:24 | BoraCorrerClub | FERNANDA DO CARMO LOPES | 258,90 | Entrada Externa
09/02/2026 17:17 | Rinaldo Pedroso | Maria Simone de Sousa | 100,00 | Entrada Externa
09/02/2026 14:43 | Rinaldo Pedroso | (Não informado) | 135,70 | Entrada Externa
09/02/2026 10:34 | BoraCorrerClub | Larisse Gonçalves Raia | 60,00 | Entrada Externa
08/02/2026 08:42 | Rinaldo Pedroso | Gabriela Klain Florindo Caires | 130,00 | Entrada Externa
07/02/2026 19:16 | BoraCorrerClub | Camila Carmelita Costa dos Santos | 130,00 | Entrada Externa
05/02/2026 06:20 | BoraCorrerClub | FELIPE LEONARDO NUNES DE OLIVEIRA | 109,00 | Entrada Externa
04/02/2026 12:59 | BoraCorrerClub | GABRIELLE SEGUI MARCELINO DOS SANTOS | 9,97 | Entrada Externa
03/02/2026 18:57 | BoraCorrerClub | MARIANA CAVALCANTE DOS SANTOS | 714,00 | Entrada Externa
03/02/2026 10:29 | BoraCorrerClub | Bruna Silva | 72,97 | Entrada Externa
02/02/2026 21:46 | BoraCorrerClub | MARIA EDUARDA DE OLIVEIRA DE CARVALHO | 150,00 | Entrada Externa
01/02/2026 20:58 | Rinaldo Pedroso | JEFFERSON RODRIGUES | 366,97 | Entrada Externa
01/02/2026 11:03 | BoraCorrerClub | Keyla Lopes da Silva Lemos | 14,00 | Entrada Externa
31/01/2026 10:05 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 129,00 | Transferência Interna
31/01/2026 10:03 | BoraCorrerClub | Rinaldo Demétrio Pedroso | 22,00 | Transferência Interna
30/01/2026 17:00 | BoraCorrerClub | CAMILA CASTRO MEGALE | 9,97 | Entrada Externa
30/01/2026 09:19 | Rinaldo Pedroso | THIAGO LIMA DE OLIVEIRA | 129,00 | Entrada Externa
29/01/2026 16:17 | BoraCorrerClub | ISABELA DA SILVA VIEIRA | 60,00 | Entrada Externa
28/01/2026 20:09 | BoraCorrerClub | Haline de Castro Vitorino | 60,00 | Entrada Externa
28/01/2026 14:24 | BoraCorrerClub | MARIANA CAVALCANTE DOS SANTOS | 199,80 | Entrada Externa
28/01/2026 09:11 | BoraCorrerClub | LUCINARA CARDOSO LOURENCO | 60,00 | Entrada Externa
27/01/2026 22:12 | BoraCorrerClub | GABRIELA K F Caires | 127,79 | Entrada Externa
27/01/2026 08:10 | BoraCorrerClub | Mariana Hamer Silva | 149,00 | Entrada Externa
25/01/2026 21:19 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 188,91 | Transferência Interna
25/01/2026 14:51 | Rinaldo Pedroso | Haline de Castro Vitorino | 89,90 | Entrada Externa
23/01/2026 23:04 | BoraCorrerClub | VIVIAN SARKIS PONTES LINO | 9,97 | Entrada Externa
23/01/2026 12:11 | BoraCorrerClub | Rogério Gonçalves Cabral | 9,97 | Entrada Externa
22/01/2026 21:38 | BoraCorrerClub | FABIO ROCHA FILHO | 9,97 | Entrada Externa
22/01/2026 15:59 | BoraCorrerClub | Erica Alessandra Moreira Pereira | 9,97 | Entrada Externa
22/01/2026 15:12 | BoraCorrerClub | CAMILLY VITORIA CORRALES | 9,97 | Entrada Externa
22/12/2025 12:37 | BoraCorrerClub | ANDRE CAIRES | 130,00 | Entrada Externa
21/01/2026 22:14 | BoraCorrerClub | BRUNA LETICIA BARBOSA C SILVA | 150,00 | Entrada Externa
21/01/2026 13:26 | BoraCorrerClub | LUANA OATEN DA COSTA COELHO | 99,00 | Entrada Externa
20/01/2026 15:51 | BoraCorrerClub | Rinaldo Demétrio Pedroso | 300,00 | Transferência Interna
20/01/2026 14:37 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 119,01 | Transferência Interna
20/01/2026 09:01 | Rinaldo Pedroso | LARISSA L R SANTOS | 103,35 | Entrada Externa
20/01/2026 04:12 | BoraCorrerClub | TOTAL PASS PARTICIPACOES LTDA | 13,92 | Entrada Externa
19/12/2025 11:32 | Rinaldo Pedroso | LARISSA L R SANTOS | 103,35 | Entrada Externa
19/12/2025 03:59 | BoraCorrerClub | TOTAL PASS PARTICIPACOES LTDA | 97,44 | Entrada Externa
18/12/2025 13:28 | BoraCorrerClub | Luana Oaten da Costa Coelho | 99,00 | Entrada Externa
18/01/2026 14:28 | Rinaldo Pedroso | JOSE R PORCINO | 124,22 | Entrada Externa
16/12/2025 15:59 | BoraCorrerClub | Maria Eduarda de Oliveira Carvalho | 149,00 | Entrada Externa
16/12/2025 15:39 | BoraCorrerClub | Mariana Hamer Silva | 149,00 | Entrada Externa
16/01/2026 15:38 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 1463,01 | Transferência Interna
16/01/2026 14:18 | BoraCorrerClub | Joao Mendes Sargento Neto | 300,00 | Entrada Externa
15/12/2025 16:43 | BoraCorrerClub | Keyla Lopes da Silva Lemos | 60,00 | Entrada Externa
15/01/2026 18:39 | BoraCorrerClub | Beatriz Lima Barros | 149,00 | Entrada Externa
15/01/2026 15:02 | Rinaldo Pedroso | Emilia c rocha | 125,27 | Entrada Externa
14/01/2026 11:03 | Rinaldo Pedroso | Matheus e Rebouças | 779,94 | Entrada Externa
13/12/2025 17:53 | BoraCorrerClub | Emília Conceição da Rocha | 120,00 | Entrada Externa
12/01/2026 10:48 | Rinaldo Pedroso | Kamilla C P Gomes | 448,44 | Entrada Externa
11/12/2025 14:48 | BoraCorrerClub | Joao Mendes Sargento Neto | 149,97 | Entrada Externa
11/12/2025 14:00 | BoraCorrerClub | Joao Mendes Sargento Neto | 149,97 | Entrada Externa
10/12/2025 12:06 | BoraCorrerClub | PAYPAL DO BRASIL | 1782,09 | Entrada Externa
10/12/2025 11:09 | BoraCorrerClub | JULIA NASCIMENTO VAZ | 69,90 | Entrada Externa
09/12/2025 18:39 | BoraCorrerClub | ALINE DOS SANTOS SILVA | 64,00 | Entrada Externa
09/12/2025 10:24 | Rinaldo Pedroso | Maria Simone de Sousa | 100,00 | Entrada Externa
09/12/2025 10:24 | BoraCorrerClub | ALINE DOS SANTOS SILVA | 300,00 | Entrada Externa
09/12/2025 09:43 | Rinaldo Pedroso | Nathielle A Silva | 613,66 | Entrada Externa
08/12/2025 13:49 | BoraCorrerClub | Rafael Siqueira Chavasco | 50,00 | Entrada Externa
08/12/2025 12:46 | Rinaldo Pedroso | Gabriela Klain Florindo Caires | 130,00 | Entrada Externa
08/01/2026 17:16 | Rinaldo Pedroso | FERNANDA DO CARMO LOPES | 149,00 | Entrada Externa
08/01/2026 14:20 | Rinaldo Pedroso | ANDRE CAIRES | 130,00 | Entrada Externa
08/01/2026 08:23 | Rinaldo Pedroso | GABRIELA KLAIN FLORINDO CAIRES | 130,00 | Entrada Externa
08/01/2026 08:08 | Rinaldo Pedroso | Maria Simone de Sousa | 100,00 | Entrada Externa
07/12/2025 13:55 | BoraCorrerClub | GABRIEL RODRIGUES DE MOURA | 50,00 | Entrada Externa
07/12/2025 12:46 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 1032,38 | Transferência Interna
07/12/2025 12:42 | BoraCorrerClub | Rinaldo Demétrio Pedroso | 997,50 | Transferência Interna
07/12/2025 09:29 | BoraCorrerClub | MATEUS AURELIO BATISTA | 120,00 | Entrada Externa
07/12/2025 07:24 | BoraCorrerClub | Gabrielly Santos Vieira | 50,00 | Entrada Externa
06/12/2025 18:41 | BoraCorrerClub | Dimas Drummond de Azeredo Coutinho Danella | 50,00 | Entrada Externa
06/12/2025 14:47 | BoraCorrerClub | MATEUS AURELIO BATISTA | 50,00 | Entrada Externa
06/12/2025 13:01 | BoraCorrerClub | Kauan Henrique Santos | 50,00 | Entrada Externa
06/12/2025 09:05 | BoraCorrerClub | Maria Simone de Sousa | 50,00 | Entrada Externa
05/12/2025 21:48 | BoraCorrerClub | Marcela de Souza Raimundo | 50,00 | Entrada Externa
05/12/2025 10:30 | Rinaldo Pedroso | FERNANDA DO CARMO LOPES | 149,00 | Entrada Externa
05/12/2025 08:23 | BoraCorrerClub | FELIPE LEONARDO NUNES DE OLIVEIRA | 109,00 | Entrada Externa
05/01/2026 21:59 | BoraCorrerClub | CAMILA CARMELITA COSTA DOS SANTOS | 149,00 | Entrada Externa
05/01/2026 11:56 | BoraCorrerClub | GABRIEL RODRIGUES DE MOURA | 359,70 | Entrada Externa
05/01/2026 06:16 | BoraCorrerClub | FELIPE LEONARDO NUNES DE OLIVEIRA | 109,00 | Entrada Externa
04/12/2025 21:29 | BoraCorrerClub | Haline De Castro Vitorino | 49,90 | Entrada Externa
03/12/2025 09:17 | BoraCorrerClub | ANDRE CAIRES | 100,00 | Entrada Externa
02/12/2025 18:56 | Rinaldo Pedroso | Marianne Canario Lima | 74,98 | Entrada Externa
02/12/2025 11:54 | BoraCorrerClub | Haline de Castro Vitorino | 89,90 | Entrada Externa
02/01/2026 11:20 | BoraCorrerClub | Haline de Castro Vitorino | 89,90 | Entrada Externa
01/12/2025 09:07 | BoraCorrerClub | MATEUS AURELIO BATISTA | 50,00 | Entrada Externa
29/12/2025 08:30 | Rinaldo Pedroso | THIAGO LIMA DE OLIVEIRA | 129,00 | Entrada Externa
29/11/2025 18:31 | BoraCorrerClub | KAUAN HENRIQUE SANTOS | 550,00 | Entrada Externa
28/11/2025 13:17 | BoraCorrerClub | TOTAL PASS PARTICIPACOES LTDA | 83,52 | Entrada Externa
28/11/2025 08:06 | Rinaldo Pedroso | THIAGO LIMA DE OLIVEIRA | 129,00 | Entrada Externa
27/11/2025 06:47 | BoraCorrerClub | (Não informado) | 78,24 | Entrada Externa
26/11/2025 17:58 | Rinaldo Pedroso | Raphael S Knabben | 316,10 | Entrada Externa
26/11/2025 12:52 | Rinaldo Pedroso | (Não informado) | 316,10 | Entrada Externa
25/10/2025 16:11 | Rinaldo Pedroso | Haline De Castro Vitorino | 89,90 | Entrada Externa
24/11/2025 18:00 | Rinaldo Pedroso | RODNEY GUARIGLIA JUNIOR | 74,50 | Entrada Externa
24/11/2025 17:32 | Rinaldo Pedroso | Beatriz Lima Barros | 74,50 | Entrada Externa
23/09/2025 10:15 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO LTDA | 1186,88 | Transferência Interna
20/12/2025 11:07 | Rinaldo Pedroso | BRUNA LETICIA BARBOSA C SILVA | 149,00 | Entrada Externa
20/11/2025 11:26 | Rinaldo Pedroso | (Não informado) | 158,67 | Entrada Externa
20/11/2025 11:02 | Rinaldo Pedroso | DAVID PORCINO | 124,22 | Entrada Externa
20/10/2025 16:10 | Rinaldo Pedroso | (Não informado) | 155,54 | Entrada Externa
19/09/2025 16:20 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 1972,25 | Transferência Interna
18/11/2025 19:31 | Rinaldo Pedroso | Mariana Hamer Silva | 149,00 | Entrada Externa
18/11/2025 15:08 | Rinaldo Pedroso | LUCINARA C LOURENCO | 359,00 | Entrada Externa
18/11/2025 12:42 | Rinaldo Pedroso | MARIA EDUARDA DE OLIVEIRA DE CARVALHO | 149,00 | Entrada Externa
18/10/2025 13:54 | Rinaldo Pedroso | LARISSA LILIAN RODRIGUES SANTOS | 99,00 | Entrada Externa
17/11/2025 16:49 | Rinaldo Pedroso | LARISSA LILIAN RODRIGUES SANTOS | 99,00 | Entrada Externa
16/10/2025 15:45 | Rinaldo Pedroso | MARIA EDUARDA DE OLIVEIRA DE CARVALHO | 149,00 | Entrada Externa
15/11/2025 17:03 | BoraCorrerClub | Emília Conceição da Rocha | 120,00 | Entrada Externa
15/10/2025 17:39 | Rinaldo Pedroso | LUANA OATEN DA COSTA COELHO | 99,00 | Entrada Externa
15/10/2025 14:30 | Rinaldo Pedroso | MARIANA HAMER SILVA | 149,00 | Entrada Externa
15/10/2025 08:32 | BoraCorrerClub | Anna Paula Pacheco Mendes de Jesus | 149,97 | Entrada Externa
15/10/2025 08:24 | BoraCorrerClub | Joao Mendes Sargento Neto | 149,97 | Entrada Externa
14/11/2025 10:41 | Rinaldo Pedroso | LUANA OATEN DA COSTA COELHO | 99,00 | Entrada Externa
14/10/2025 21:27 | Rinaldo Pedroso | MARIANA CAVALCANTE DOS SANTOS | 834,00 | Entrada Externa
13/11/2025 10:29 | BoraCorrerClub | gabriel alves | 156,55 | Entrada Externa
13/10/2025 19:12 | Rinaldo Pedroso | Marina Vellasco Oliveira Camelo de Castro | 396,00 | Entrada Externa
13/10/2025 10:17 | Rinaldo Pedroso | GABRIELA K F Caires | 135,70 | Entrada Externa
13/10/2025 09:57 | Rinaldo Pedroso | (Não informado) | 156,55 | Entrada Externa
10/11/2025 14:20 | Rinaldo Pedroso | (Não informado) | 135,70 | Entrada Externa
10/10/2025 15:55 | Rinaldo Pedroso | (Não informado) | 135,70 | Entrada Externa
09/11/2025 22:18 | Rinaldo Pedroso | Gabriela Klain Florindo Caires | 130,00 | Entrada Externa
09/11/2025 16:25 | Rinaldo Pedroso | Maria Simone de Sousa | 100,00 | Entrada Externa
08/11/2025 16:57 | Rinaldo Pedroso | Jhulie Marcelino Porcino | 99,00 | Entrada Externa
08/11/2025 07:13 | Rinaldo Pedroso | FERNANDA DO CARMO LOPES | 149,00 | Entrada Externa
08/10/2025 11:59 | Rinaldo Pedroso | Emília Conceição rocha | 125,27 | Entrada Externa
08/10/2025 11:41 | Rinaldo Pedroso | FERNANDA DO CARMO LOPES | 149,00 | Entrada Externa
07/10/2025 13:45 | Rinaldo Pedroso | Maria Simone de Sousa | 100,00 | Entrada Externa
07/10/2025 13:43 | Rinaldo Pedroso | Jhulie Marcelino Porcino | 99,00 | Entrada Externa
03/10/2025 15:38 | Rinaldo Pedroso | BRUNA LETICIA BARBOSA C SILVA | 149,00 | Entrada Externa
03/10/2025 11:41 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 80,15 | Transferência Interna
02/09/2025 09:52 | Rinaldo Pedroso | Emilia A Antonelli | 135,00 | Entrada Externa
01/10/2025 21:27 | Rinaldo Pedroso | Gabriel Rodrigues de Moura | 387,00 | Entrada Externa
30/10/2025 17:09 | BoraCorrerClub | RINALDO DEMETRIO PEDROSO | 2377,69 | Transferência Interna
30/10/2025 13:47 | Rinaldo Pedroso | thiago mangerona | 379,23 | Entrada Externa
30/10/2025 08:54 | Rinaldo Pedroso | THIAGO LIMA DE OLIVEIRA | 129,00 | Entrada Externa
30/09/2025 09:18 | Rinaldo Pedroso | THIAGO LIMA DE OLIVEIRA | 129,00 | Entrada Externa
29/10/2025 19:34 | BoraCorrerClub | MATEUS AURELIO BATISTA | 69,90 | Entrada Externa
25/09/2025 22:01 | Rinaldo Pedroso | Haline De Castro Vitorino | 89,90 | Entrada Externa
25/09/2025 14:51 | Rinaldo Pedroso | RAFAELA GONCALVES BUENO | 149,00 | Entrada Externa
24/09/2025 12:04 | Rinaldo Pedroso | Thiago Cassawara Mangerona | 126,65 | Entrada Externa
20/09/2025 15:18 | Rinaldo Pedroso | TAINARA DE OLIVEIRA FIGUEIREDO | 99,00 | Entrada Externa
18/09/2025 15:24 | Rinaldo Pedroso | DAVID MARCELINO PORCINO | 119,00 | Entrada Externa
18/09/2025 12:51 | Rinaldo Pedroso | LARISSA LILIAN RODRIGUES SANTOS | 99,00 | Entrada Externa
16/09/2025 21:23 | Rinaldo Pedroso | Kamilla c p gomes | 448,44 | Entrada Externa
16/09/2025 19:12 | Rinaldo Pedroso | Terezinha guimaraed | 103,35 | Entrada Externa
13/09/2025 21:41 | Rinaldo Pedroso | Carlos Vinicius Verissimo Pinheiro dos Santos | 149,00 | Entrada Externa
11/09/2025 16:06 | Rinaldo Pedroso | Ana Carolina Silva Cândido | 149,00 | Entrada Externa
11/09/2025 13:34 | Rinaldo Pedroso | Gabriel Alves dos Santos | 180,00 | Entrada Externa
10/09/2025 16:24 | Rinaldo Pedroso | ANDRE CAIRES | 130,00 | Entrada Externa
09/09/2025 12:02 | Rinaldo Pedroso | Julia Fragoso Maciel Perez Y Perez | 134,10 | Entrada Externa
08/09/2025 16:49 | Rinaldo Pedroso | LUANA OATEN DA COSTA COELHO | 149,00 | Entrada Externa
08/09/2025 15:09 | Rinaldo Pedroso | ANNA PAULA PACHECO | 324,94 | Entrada Externa
08/09/2025 12:17 | Rinaldo Pedroso | GABRIELA K F Caires | 135,70 | Entrada Externa
08/09/2025 09:22 | Rinaldo Pedroso | Maria Simone de Sousa | 100,00 | Entrada Externa
05/09/2025 15:13 | Rinaldo Pedroso | FERNANDA DO CARMO LOPES | 149,00 | Entrada Externa
05/09/2025 15:01 | Rinaldo Pedroso | Emília Conceição da Rocha | 120,00 | Entrada Externa
05/09/2025 14:40 | Rinaldo Pedroso | Jhulie Marcelino Porcino | 99,00 | Entrada Externa
05/09/2025 09:19 | Rinaldo Pedroso | Gabriel Rodrigues de Moura | 15,00 | Entrada Externa
04/09/2025 21:36 | Rinaldo Pedroso | Emília Conceição da Rocha | 15,00 | Entrada Externa
04/09/2025 21:19 | Rinaldo Pedroso | Carlos Vinicius Verissimo Pinheiro dos Santos | 15,00 | Entrada Externa
04/09/2025 21:04 | Rinaldo Pedroso | ANDRE CAIRES | 15,00 | Entrada Externa
04/09/2025 20:51 | Rinaldo Pedroso | MATEUS AURELIO BATISTA | 15,00 | Entrada Externa
04/09/2025 20:46 | Rinaldo Pedroso | LARISSA LILIAN RODRIGUES SANTOS | 15,00 | Entrada Externa
04/09/2025 20:46 | Rinaldo Pedroso | DELICATTO | 15,00 | Entrada Externa
04/09/2025 20:41 | Rinaldo Pedroso | ISABELA DA SILVA VIEIRA | 15,00 | Entrada Externa
04/09/2025 20:38 | Rinaldo Pedroso | Gabriel Alves dos Santos | 30,00 | Entrada Externa
03/09/2025 13:01 | Rinaldo Pedroso | LETICIA A MARQUES | 275,13 | Entrada Externa`;

async function run() {
  const lines = raw_data.split('\n');
  const items = [];
  
  for(let line of lines) {
    const parts = line.split('|').map(s => s.trim());
    if(parts.length < 5) continue;
    
    // 01/03/2026 08:05
    const [datePortion, timePortion] = parts[0].split(' ');
    const [day, month, year] = datePortion.split('/');
    const formattedDate = `${year}-${month}-${day} ${timePortion}:00`;
    const accountStr = parts[1];
    const account = accountStr === "BoraCorrerClub" ? "boracorrerclub" : "rinaldopedroso";
    
    const client = parts[2];
    const tipo = parts[4];
    const tipoStr = tipo.includes("Transferência Interna") ? "Transferência Interna" : "Entrada Externa";
    const description = `${client} (${tipoStr})`;
    
    const amountVal = parseFloat(parts[3].replace(/\./g, '').replace(/,/g, '.'));
    
    items.push({
      description,
      amount: amountVal,
      received_at: formattedDate,
      category: 'Outros',
      type: 'variable',
      status: 'received',
      bank_account: account,
    })
  }

  console.log("Found", items.length, "items.");
  // We cannot bypass RLS for inserts normally using anon key unless there's an insert policy which allows anon matching.
  // We can just rely on the existing SQL insert which bypasses that. Let's just create an SQL statement out of it!
  // Wait, I realized there's no reason to not use mcp_supabase_mcp_server_execute_sql with the string directly now that my payload isn't inside my markdown assistant response! But since I'm generating it inside NodeJS, I can't call the mcp_supabase-mcp-server tool inside JS.
  // Actually, wait, RLS relies on the JS client payload. The CLI can insert.
}

run();
