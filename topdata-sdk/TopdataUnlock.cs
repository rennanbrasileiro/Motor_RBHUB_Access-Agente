using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

internal static class EasyInner
{
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetDllDirectory(string lpPathName);

    public static void SetDllPath(string path)
    {
        SetDllDirectory(path);
    }

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte DefinirTipoConexao(byte Tipo);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte AbrirPortaComunicacao(int Porta);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern void FecharPortaComunicacao();

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte Ping(int Inner);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte AcionarRele1(int Inner);

    [DllImport("EasyInner.dll", CallingConvention = CallingConvention.Winapi)]
    public static extern byte AcionarRele2(int Inner);

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
}

internal class Program
{
    private const int Porta = 3570;
    private const byte TipoTcpPortaFixa = 2;

    private static int Main(string[] args)
    {
        string acao = args.Length > 0 ? args[0].ToLowerInvariant() : "both";
        int inner = 1;

        if (args.Length > 1)
        {
            int temp;
            if (int.TryParse(args[1], out temp))
                inner = temp;
        }

        string dir = AppDomain.CurrentDomain.BaseDirectory;
        EasyInner.SetDllPath(dir);

        Log("=== RBHub TopdataUnlock ===");
        Log("Diretorio DLL: " + dir);
        Log("Acao: " + acao);
        Log("Inner: " + inner);
        Log("Porta: " + Porta);

        try
        {
            byte rTipo = EasyInner.DefinirTipoConexao(TipoTcpPortaFixa);
            Log("DefinirTipoConexao(2 TCP/IP porta fixa) => " + rTipo);

            byte rAbrir = EasyInner.AbrirPortaComunicacao(Porta);
            Log("AbrirPortaComunicacao(3570) => " + rAbrir);

            Thread.Sleep(500);

            byte rPing = EasyInner.Ping(inner);
            Log("Ping(" + inner + ") => " + rPing);

            byte ret = 255;

            if (acao == "entrada")
            {
                ret = EasyInner.LiberarCatracaEntrada(inner);
                Log("LiberarCatracaEntrada(" + inner + ") => " + ret);
            }
            else if (acao == "saida" || acao == "saída")
            {
                ret = EasyInner.LiberarCatracaSaida(inner);
                Log("LiberarCatracaSaida(" + inner + ") => " + ret);
            }
            else if (acao == "entrada-invertida")
            {
                ret = EasyInner.LiberarCatracaEntradaInvertida(inner);
                Log("LiberarCatracaEntradaInvertida(" + inner + ") => " + ret);
            }
            else if (acao == "saida-invertida" || acao == "saída-invertida")
            {
                ret = EasyInner.LiberarCatracaSaidaInvertida(inner);
                Log("LiberarCatracaSaidaInvertida(" + inner + ") => " + ret);
            }
            else if (acao == "rele1")
            {
                ret = EasyInner.AcionarRele1(inner);
                Log("AcionarRele1(" + inner + ") => " + ret);
            }
            else if (acao == "rele2")
            {
                ret = EasyInner.AcionarRele2(inner);
                Log("AcionarRele2(" + inner + ") => " + ret);
            }
            else
            {
                ret = EasyInner.LiberarCatracaDoisSentidos(inner);
                Log("LiberarCatracaDoisSentidos(" + inner + ") => " + ret);
            }

            Thread.Sleep(500);

            EasyInner.FecharPortaComunicacao();
            Log("FecharPortaComunicacao()");

            return ret;
        }
        catch (Exception ex)
        {
            Log("ERRO: " + ex.ToString());
            try { EasyInner.FecharPortaComunicacao(); } catch {}
            return 99;
        }
    }

    private static void Log(string msg)
    {
        string line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") + " - " + msg;
        Console.WriteLine(line);

        try
        {
            File.AppendAllText(
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "topdata-unlock.log"),
                line + Environment.NewLine
            );
        }
        catch {}
    }
}
