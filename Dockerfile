FROM alpine:3.5

# Create our group & user, along with homedir
RUN addgroup -S app && \
    adduser -S app -G app -h /app

ENV RAILS_ENV="docker" \
    RACK_ENV="docker" \
    BUNDLE_SILENCE_ROOT_WARNING=1

WORKDIR /app
ADD . /app

# Lines 36 & 37 here are a quick fix to get around Heroku not
# working well with sqlite3 in the Gemfile.

RUN apk update && \
    apk upgrade && \
    apk --no-cache add --update --virtual .build \
        build-base \
        libressl-dev \
        libffi-dev \
        libxml2-dev \
        libxslt-dev \
        ruby-dev && \
    apk --no-cache add --update \
        ca-certificates \
        libressl \
        nodejs \
        ruby \
        ruby-bigdecimal \
        ruby-bundler \
        ruby-json \
        sqlite-dev \
        tzdata && \
    echo "gem 'sqlite3'" >> Gemfile && \
    bundle lock --update=sqlite3 && \
    bundle install --clean --deployment --without production && \
    bundle exec rake db:drop && \
    bundle exec rake db:migrate && \
    bundle exec rake assets:precompile && \
    bundle exec rake assets:clean && \
    apk del --purge .build && \
    rm -rf /usr/share/doc/* \
        /var/cache/apk \
        /var/lib/{apt,dpkg,cache,log}/* \
        /root/.bundle/* \
        /root/.gem/* \
        /usr/lib/node_modules/npm/node_modules/ \
        /app/vendor/bundle/ruby/*/cache && \
    chown -R app:app /app

USER app:app
CMD ["/usr/bin/bundle","exec","rails","server","-b","0.0.0.0","-p","3000"]
EXPOSE 3000