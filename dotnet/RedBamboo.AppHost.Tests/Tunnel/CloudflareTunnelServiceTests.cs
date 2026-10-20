using RedBamboo.AppHost.Tunnel;
using Xunit;

namespace RedBamboo.AppHost.Tests.Tunnel;

public sealed class CloudflareTunnelServiceTests
{
    [Fact]
    public void CreateStartInfo_PutsTokenOnlyInEnvironment()
    {
        const string token = "secret-tunnel-token";

        var startInfo = CloudflareTunnelService.CreateStartInfo("cloudflared.exe", token);

        Assert.Equal("tunnel run", startInfo.Arguments);
        Assert.DoesNotContain(token, startInfo.Arguments, StringComparison.Ordinal);
        Assert.DoesNotContain("--token", startInfo.Arguments, StringComparison.Ordinal);
        Assert.Equal(token, startInfo.Environment["TUNNEL_TOKEN"]);
        Assert.False(startInfo.UseShellExecute);
        Assert.True(startInfo.CreateNoWindow);
        Assert.Equal(System.Diagnostics.ProcessWindowStyle.Hidden, startInfo.WindowStyle);
        Assert.True(startInfo.RedirectStandardOutput);
        Assert.True(startInfo.RedirectStandardError);
    }

    [Fact]
    public void IsOwnedProcess_MatchesPidStartTimeAndImage()
    {
        var identity = new TunnelProcessIdentity(1234, 987654321);

        Assert.True(CloudflareTunnelService.IsOwnedProcess(
            identity, 1234, 987654321, "cloudflared"));
    }

    [Theory]
    [InlineData(4321, 987654321, "cloudflared")]
    [InlineData(1234, 123, "cloudflared")]
    [InlineData(1234, 987654321, "not-cloudflared")]
    public void IsOwnedProcess_RejectsIdentityMismatch(
        int processId,
        long startTimeUtcTicks,
        string processName)
    {
        var identity = new TunnelProcessIdentity(1234, 987654321);

        Assert.False(CloudflareTunnelService.IsOwnedProcess(
            identity, processId, startTimeUtcTicks, processName));
    }

    [Fact]
    public void IsOwnedProcess_RejectsReusedPidWithDifferentStartTime()
    {
        var previousProcess = new TunnelProcessIdentity(1234, 987654321);

        Assert.False(CloudflareTunnelService.IsOwnedProcess(
            previousProcess, 1234, 987654322, "cloudflared"));
    }

    [Theory]
    [InlineData("cloudflared.exe tunnel run --token exact-token", true)]
    [InlineData("cloudflared.exe tunnel run --token=exact-token", true)]
    [InlineData("cloudflared.exe tunnel run --token \"exact-token\"", true)]
    [InlineData("cloudflared.exe tunnel run --token exact-token-suffix", false)]
    [InlineData("cloudflared.exe tunnel run --token prefix-exact-token", false)]
    [InlineData("cloudflared.exe tunnel run --other exact-token", false)]
    [InlineData("cloudflared.exe tunnel run", false)]
    public void CommandLineContainsLegacyToken_MatchesOnlyExactTokenArgument(
        string commandLine,
        bool expected)
    {
        Assert.Equal(expected,
            CloudflareTunnelService.CommandLineContainsLegacyToken(commandLine, "exact-token"));
    }
}
