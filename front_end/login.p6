use HTTP::UserAgent;
use IO::Socket::SSL;
use JSON::Fast;
use Digest::MD5;

constant URI = 'http://home.remi.moe:8000/api/login';
constant URI_T = 'https://postman-echo.com/post';
constant USR = 'admin';
constant PSW = 'bjsdxb';

sub md5(Str $s) {
    Digest::MD5.new.md5_hex($s)
}

sub post($a, %form, %header) {
    my $req = HTTP::Request.new(POST => URI, |%header);
    $req.add-content(to-json %form);
    return $a.request($req);
}

my $a = HTTP::UserAgent.new;

# get
my Str $tt = $a.get(URI).content;
say 'got tt: ' ~ $tt;

# post
my %h = ('content-type' => 'application/json');
my %p = ('usr' => USR, 'hash' => md5(PSW ~ $tt), 'time_token' => $tt);
my $req = post($a, %p, %h);

die $req.status-line unless $req.is-success;
say $req.content;
