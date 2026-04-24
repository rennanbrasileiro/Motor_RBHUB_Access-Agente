using System;
using System.Diagnostics;
using System.IO;
using System.Net;
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
}

internal class Program
{
    private const int PORTA_INNER = 3570;
    private const int PORTA_HTTP = 3002;
    private const byte TIPO_TCP_PORTA_FIXA = 2;

    private static readonly object Gate = new object();
    private static bool Started = false;

    private static int Main(string[] args)
    {
        EasyInner.SetDllPath(AppDomain.CurrentDomain.BaseDirectory);

        Log("=== RBHub TopdataSdkServer iniciando ===");
        Log("Diretorio DLL: " + AppDomain.CurrentDomain.BaseDirectory);

        try
        {
            StartInner();
        }
        catch (Exception ex)
        {
            Log("ERRO AO INICIAR INNER: " + ex);
        }

        HttpListener listener = new HttpListener();
        listener.Prefixes.Add("http://127.0.0.1:" + PORTA_HTTP + "/");
        listener.Start();

        Log("HTTP ativo em http://127.0.0.1:" + PORTA_HTTP + "/");
        Log("Endpoints: /unlock?catraca=1 | /unlock?catraca=2 | /status | /reinit | /stop");

        while (true)
        {
            HttpListenerContext ctx = listener.GetContext();
            ThreadPool.QueueUserWorkItem(delegate { Handle(ctx, listener); });
        }
    }

    private static void Handle(HttpListenerContext ctx, HttpListener listener)
    {
        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            string path = ctx.Request.Url.AbsolutePath.ToLowerInvariant();

            if (path == "/status")
            {
                Write(ctx, 200, "{\"ok\":true,\"started\":" + Bool(Started) + "}");
                return;
            }

            if (path == "/reinit")
            {
                lock (Gate)
                {
                    RestartInner();
                }

                Write(ctx, 200, "{\"ok\":true,\"message\":\"reinitialized\"}");
                return;
            }

            if (path == "/stop")
            {
                Write(ctx, 200, "{\"ok\":true,\"message\":\"stopping\"}");
                try { EasyInner.FecharPortaComunicacao(); } catch {}
                Environment.Exit(0);
                return;
            }

            if (path == "/unlock")
            {
                string c = ctx.Request.QueryString["catraca"] ?? "1";
                int inner = c == "2" ? 2 : 1;

                UnlockResult result;

                lock (Gate)
                {
                    if (!Started)
                        StartInner();

                    result = Unlock(inner);
                }

                sw.Stop();

                string json =
                    "{\"ok\":" + Bool(result.Ok) +
                    ",\"catraca\":" + inner +
                    ",\"acao\":\"" + result.Acao + "\"" +
                    ",\"retorno\":" + result.Retorno +
                    ",\"elapsedMs\":" + sw.ElapsedMilliseconds +
                    "}";

                Write(ctx, result.Ok ? 200 : 500, json);
                return;
            }

            Write(ctx, 404, "{\"ok\":false,\"error\":\"not_found\"}");
        }
        catch (Exception ex)
        {
            sw.Stop();
            Log("ERRO HTTP: " + ex);
            Write(ctx, 500, "{\"ok\":false,\"error\":\"" + Escape(ex.Message) + "\",\"elapsedMs\":" + sw.ElapsedMilliseconds + "}");
        }
    }

    private static void StartInner()
    {
        lock (Gate)
        {
            Log("Inicializando comunicação Inner...");

            byte r1 = EasyInner.DefinirTipoConexao(TIPO_TCP_PORTA_FIXA);
            Log("DefinirTipoConexao(2) => " + r1);

            byte r2 = EasyInner.AbrirPortaComunicacao(PORTA_INNER);
            Log("AbrirPortaComunicacao(3570) => " + r2);

            Thread.Sleep(250);

            byte p1 = EasyInner.Ping(1);
            byte p2 = EasyInner.Ping(2);
            Log("Ping(1) => " + p1);
            Log("Ping(2) => " + p2);

            PrepareOnline(1);
            PrepareOnline(2);

            Started = true;
            Log("Comunicação pronta.");
        }
    }

    private static void RestartInner()
    {
        try { EasyInner.FecharPortaComunicacao(); } catch {}
        Started = false;
        Thread.Sleep(300);
        StartInner();
    }

    private static void PrepareOnline(int inner)
    {
        Log("Preparando online inner " + inner + "...");

        byte c1 = EasyInner.ConfigurarInnerOnLine();
        Log("ConfigurarInnerOnLine() => " + c1);

        byte c2 = EasyInner.EnviarConfiguracoes(inner);
        Log("EnviarConfiguracoes(" + inner + ") => " + c2);

        Thread.Sleep(120);

        byte c3 = EasyInner.EnviarMensagemPadraoOnLine(inner, 1, "RB HUB ACESSO");
        Log("EnviarMensagemPadraoOnLine(" + inner + ") => " + c3);

        Thread.Sleep(120);

        byte c4 = EasyInner.EnviarFormasEntradasOnLine(inner, 14, 0, 16, 10, 1);
        Log("EnviarFormasEntradasOnLine(" + inner + ") => " + c4);
    }

    private static UnlockResult Unlock(int inner)
    {
        Log("UNLOCK solicitado para catraca " + inner);

        // Ordem rápida, baseada no que abriu no seu teste:
        // catraca 1: saida inner 1
        // catraca 2: both inner 2
        string[] ordem = inner == 1
            ? new string[] { "saida", "both", "saida-invertida", "entrada", "entrada-invertida" }
            : new string[] { "both", "saida", "entrada", "saida-invertida", "entrada-invertida" };

        foreach (string acao in ordem)
        {
            byte ret = CallUnlock(inner, acao);
            Log("Tentativa " + acao + " inner " + inner + " => " + ret);

            if (ret == 0)
                return new UnlockResult(true, acao, ret);
        }

        Log("Sem sucesso. Repreparando online e tentando comando principal...");

        PrepareOnline(inner);

        string principal = inner == 1 ? "saida" : "both";
        byte ret2 = CallUnlock(inner, principal);
        Log("Tentativa final " + principal + " inner " + inner + " => " + ret2);

        return new UnlockResult(ret2 == 0, principal, ret2);
    }

    private static byte CallUnlock(int inner, string acao)
    {
        switch (acao)
        {
            case "saida":
                return EasyInner.LiberarCatracaSaida(inner);
            case "entrada":
                return EasyInner.LiberarCatracaEntrada(inner);
            case "saida-invertida":
                return EasyInner.LiberarCatracaSaidaInvertida(inner);
            case "entrada-invertida":
                return EasyInner.LiberarCatracaEntradaInvertida(inner);
            case "both":
            default:
                return EasyInner.LiberarCatracaDoisSentidos(inner);
        }
    }

    private static void Write(HttpListenerContext ctx, int status, string body)
    {
        byte[] data = Encoding.UTF8.GetBytes(body);
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json; charset=utf-8";
        ctx.Response.ContentLength64 = data.Length;
        ctx.Response.OutputStream.Write(data, 0, data.Length);
        ctx.Response.OutputStream.Close();
    }

    private static string Bool(bool b) { return b ? "true" : "false"; }

    private static string Escape(string s)
    {
        return (s ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"");
    }

    private static void Log(string msg)
    {
        string line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") + " - " + msg;
        Console.WriteLine(line);

        try
        {
            File.AppendAllText(
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "topdata-server.log"),
                line + Environment.NewLine
            );
        }
        catch {}
    }

    private struct UnlockResult
    {
        public bool Ok;
        public string Acao;
        public byte Retorno;

        public UnlockResult(bool ok, string acao, byte retorno)
        {
            Ok = ok;
            Acao = acao;
            Retorno = retorno;
        }
    }
}
