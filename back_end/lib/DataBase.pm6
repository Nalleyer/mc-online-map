unit module DataBase;
use JSON::Fast;

class Point {
    has $.x;
    has $.y;

    method gist {
        "($.x,$.y)"
    }

    method WHICH {
        ObjAt.new(self.gist);
    }
}

grammar GPoint {
    token TOP {
        '(' <X> ',' <Y> ')'
    }

    token X { <Number> }
    token Y { <Number> }
    token Number { \d+ }
}

class ActPoint {
    method TOP ($/) { make Point.new(x => $<X>, y => $<Y>) }
    method X ($/) { make $<Number>.made }
    method Y ($/) { make $<Number>.made }
    method Number ($/) { make $/.Int }
}

sub parsePoint(Str $pstr --> Point) is export {
    GPoint.parse($pstr, actions => ActPoint).made
}

class ServerData is export {
    has %!points{Any};
    has Int $!tokenId = 0;

    method incTokenId { $!tokenId += 1 }
    method tokenId    { $!tokenId      }

    method pointExists(Point:D $p --> Bool) {
        %!points{ $p }.defined;
    }

    method setPoint(Point:D $p, Str $name) {
        %!points{ $p } = $name;
    }

    method getPoints {
        my @ps;
        for %!points.kv -> $p, $n {
            @ps.push: {
                x => $p.x.Str,
                y => $p.y.Str,
                name => $n,
            };
        }
        @ps
    }

    method deletePoint(Point $p) {
        %!points{$p}:delete
    }

    submethod BUILD(Str :json_file($filePath)) {
        my %json = from-json $filePath.IO.slurp;
        $!tokenId = (%json<token_id> // '0').Int;
        %json<points> //= Hash.new;
        for %json<points>.kv -> $p, $n {
            my $point = GPoint.parse($p, actions => ActPoint.new).made;
            %!points{ $point } = $n;
        }
    }

    method save(Str $filePath) {
        my %outJson = (
            'token_id' => $!tokenId,
            'points'   => %!points.kv.map( -> $p, $n {
                $p.gist => $n
            }).hash
        );
        spurt $filePath, to-json %outJson;
    }

    method gist {
        "id: {$!tokenId}; ps: {%!points.gist}";
    }
}
