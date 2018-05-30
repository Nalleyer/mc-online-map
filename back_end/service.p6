use lib 'lib';
use Cro::HTTP::Log::File;
use Cro::HTTP::Server;
use Routes;

%*ENV<MC_PORT> = 3000;
%*ENV<MC_HOST> = '192.168.1.106';

my Cro::Service $http = Cro::HTTP::Server.new(
    http => <1.1>,
    host => %*ENV<MC_HOST> ||
        die("Missing MC_HOST in environment"),
    port => %*ENV<MC_PORT> ||
        die("Missing MC_PORT in environment"),
    application => routes(),
    after => [
        Cro::HTTP::Log::File.new(logs => $*OUT, errors => $*ERR)
    ]
);
$http.start;
say "Listening at http://%*ENV<MC_HOST>:%*ENV<MC_PORT>";
react {
    whenever signal(SIGINT) {
        #say "no I'm not going to shutting down...";
        say "down...";
        $http.stop;
        done;
    }
}
