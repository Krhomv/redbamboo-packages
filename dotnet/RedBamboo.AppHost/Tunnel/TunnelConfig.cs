namespace RedBamboo.AppHost.Tunnel;

public class TunnelConfig
{
    public bool Enabled { get; set; }
    public string? TunnelToken { get; set; }
    public string? Hostname { get; set; }
    public string? CloudflaredPath { get; set; }
    public string? AccessToken { get; set; }
    /// <summary>
    /// Detect a legacy external connector only when its command line contains an exact
    /// <c>--token</c> argument for this tunnel. Connectors using <c>TUNNEL_TOKEN</c> cannot
    /// be detected without reading another process's environment and are intentionally ignored.
    /// </summary>
    public bool DetectExternalTunnel { get; set; }
}
