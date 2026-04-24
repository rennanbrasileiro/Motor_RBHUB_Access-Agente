using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

internal static class EasyInner
{
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetDllDirectory(string lpPathName);

    public static void SetDllPath(string path) { SetDllDirectory(path); }

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte DefinirTipoConexao(byte Tipo);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte AbrirPortaComunicacao(int Porta);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern void FecharPortaComunicacao();

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte Ping(int Inner);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte ConfigurarInnerOnLine();

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte ConfigurarInnerOffLine();

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte EnviarConfiguracoes(int Inner);

    [DllImport("EasyInner.dll", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Winapi)]
    public static extern byte EnviarMensagemPadraoOnLine(int Inner, byte ExibirData, string Mensagem);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte EnviarFormasEntradasOnLine(int Inner, byte QtdeDigitosTeclado, byte EcoTeclado, byte FormaEntrada, byte TempoTeclado, byte PosicaoCursorTeclado);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte LiberarCatracaEntrada(int Inner);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte LiberarCatracaSaida(int Inner);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte LiberarCatracaEntradaInvertida(int Inner);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte LiberarCatracaSaidaInvertida(int Inner);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte LiberarCatracaDoisSentidos(int Inner);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte AcionarRele1(int Inner);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte AcionarRele2(int Inner);
}

internal class Program
{
    private const int Porta = 3570;
    private const byte TipoTcpPortaFixa = 2;

    private static int Main(string[] args)
    {
        string alvo = args.Length > 0 ? args[0].Trim().ToLowerInvariant() : "catraca1";
        string acao = args.Length > 1 ? args[1].Trim().ToLowerInvariant() : "auto";

        int inner = alvo == "catraca2" || alvo == "2" ? 2 : 1;

        string dir = AppDomain.CurrentDomain.BaseDirectory;
        EasyInner.SetDllPath(dir);

        Log("=== RBHub Topdata SDK Unlock ===");
        Log("Alvo: " + alvo);
        Log("Acao: " + acao);
        Log("Inner: " + inner);
        Log("Porta: " + Porta);
        Log("Diretorio DLL: " + dir);

        int exitCode = 99;

        try
        {
            byte rTipo = EasyInner.DefinirTipoConexao(TipoTcpPortaFixa);
            Log("DefinirTipoConexao(2 TCP/IP porta fixa) => " + rTipo);

            byte rAbrir = EasyInner.AbrirPortaComunicacao(Porta);
            Log("AbrirPortaComunicacao(3570) => " + rAbrir);

            Thread.Sleep(350);

            byte rPing = EasyInner.Ping(inner);
            Log("Ping(" + inner + ") => " + rPing);

            PrepararOnline(inner);

            byte ret;

            if (acao != "auto")
            {
                ret = ExecutarAcao(inner, acao);
                exitCode = ret;
            }
            else
            {
                ret = ExecutarAuto(inner);
                exitCode = ret;
            }

            Thread.Sleep(300);
            EasyInner.FecharPortaComunicacao();
            Log("FecharPortaComunicacao()");
            Log("EXIT_CODE=" + exitCode);
            return exitCode;
        }
        catch (Exception ex)
        {
            Log("ERRO_FATAL: " + ex);
            try { EasyInner.FecharPortaComunicacao(); } catch {}
            return 99;
        }
    }

    private static void PrepararOnline(int inner)
    {
        Log("Preparando Inner em modo online...");

        byte r1 = EasyInner.ConfigurarInnerOnLine();
        Log("ConfigurarInnerOnLine() => " + r1);

        byte r2 = EasyInner.EnviarConfiguracoes(inner);
        Log("EnviarConfiguracoes(" + inner + ") => " + r2);

        Thread.Sleep(250);

        byte r3 = EasyInner.EnviarMensagemPadraoOnLine(inner, 1, "RB HUB ACESSO");
        Log("EnviarMensagemPadraoOnLine(" + inner + ") => " + r3);

        Thread.Sleep(250);

        // FormaEntrada 16 = teclado + leitor1 + leitor2 + biometria, conforme tabela online do manual.
        byte r4 = EasyInner.EnviarFormasEntradasOnLine(inner, 14, 0, 16, 10, 1);
        Log("EnviarFormasEntradasOnLine(" + inner + ",14,0,16,10,1) => " + r4);

        Thread.Sleep(250);
    }

    private static byte ExecutarAuto(int inner)
    {
        // Ordem baseada nos retornos reais do seu ambiente:
        // Inner 1 já teve sucesso com dois-sentidos e saida-invertida.
        // Inner 2 já teve sucesso com dois-sentidos e saida.
        string[] ordem = inner == 1
            ? new string[] { "both", "saida-invertida", "entrada", "saida", "entrada-invertida", "rele1", "rele2" }
            : new string[] { "both", "saida", "entrada", "saida-invertida", "entrada-invertida", "rele1", "rele2" };

        foreach (string acao in ordem)
        {
            byte ret = ExecutarAcao(inner, acao);

            if (ret == 0)
            {
                Log("SUCESSO_AUTO: " + acao + " inner " + inner);
                return 0;
            }

            Thread.Sleep(450);
        }

        Log("AUTO_NAO_TEVE_RETORNO_ZERO");
        return 1;
    }

    private static byte ExecutarAcao(int inner, string acao)
    {
        byte ret;

        switch (acao)
        {
            case "entrada":
                ret = EasyInner.LiberarCatracaEntrada(inner);
                Log("LiberarCatracaEntrada(" + inner + ") => " + ret);
                return ret;

            case "saida":
            case "saída":
                ret = EasyInner.LiberarCatracaSaida(inner);
                Log("LiberarCatracaSaida(" + inner + ") => " + ret);
                return ret;

            case "entrada-invertida":
                ret = EasyInner.LiberarCatracaEntradaInvertida(inner);
                Log("LiberarCatracaEntradaInvertida(" + inner + ") => " + ret);
                return ret;

            case "saida-invertida":
            case "saída-invertida":
                ret = EasyInner.LiberarCatracaSaidaInvertida(inner);
                Log("LiberarCatracaSaidaInvertida(" + inner + ") => " + ret);
                return ret;

            case "both":
            case "ambos":
            case "dois":
            case "dois-sentidos":
                ret = EasyInner.LiberarCatracaDoisSentidos(inner);
                Log("LiberarCatracaDoisSentidos(" + inner + ") => " + ret);
                return ret;

            case "rele1":
                ret = EasyInner.AcionarRele1(inner);
                Log("AcionarRele1(" + inner + ") => " + ret);
                return ret;

            case "rele2":
                ret = EasyInner.AcionarRele2(inner);
                Log("AcionarRele2(" + inner + ") => " + ret);
                return ret;

            default:
                Log("ACAO_INVALIDA: " + acao);
                return 98;
        }
    }

    private static void Log(string msg)
    {
        string line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") + " - " + msg;
        Console.WriteLine(line);

        try
        {
            File.AppendAllText(
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "topdata-sdk-unlock.log"),
                line + Environment.NewLine
            );
        }
        catch {}
    }
}
